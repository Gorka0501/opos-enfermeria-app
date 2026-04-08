import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Sends user corrections to a centralized JSON file in the GitHub repo.
 *
 * Setup: create a fine-grained Personal Access Token at
 * https://github.com/settings/tokens  with:
 *   - Repository access: only "opos-enfermeria-app"
 *   - Permissions: Contents → Read and write
 * Then set it in .env as EXPO_PUBLIC_GITHUB_WRITE_TOKEN.
 *
 * Note: this token will be bundled in the APK. Use the minimum scope possible.
 */

const GITHUB_OWNER = "Gorka0501";
const GITHUB_REPO = "opos-enfermeria-app";
const GITHUB_CORRECTIONS_FILE = "data/user-corrections.json";
const GITHUB_BRANCH = "main";
const LOCAL_SUBMITTER_ID_KEY = "correctionsSubmitterId";
const AUTO_CORRECTION_MIN_UNIQUE_SUBMITTERS = 10;
const GITHUB_WRITE_TOKEN = (process.env.EXPO_PUBLIC_GITHUB_WRITE_TOKEN ?? "")
  .trim()
  .replace(/^"(.*)"$/, "$1")
  .replace(/^'(.*)'$/, "$1");

type LegacyCorrectionSubmission = {
  date: string;
  corrections: { questionId: string; originalIndex: number; newIndex: number }[];
};

export type SuggestedCorrection = {
  date: string;
  submitterId: string;
  originalIndex: number;
  suggestedIndex: number;
};

export type QuestionSuggestions = {
  originalIndex: number;
  suggestions: SuggestedCorrection[];
  autoCorrection?: {
    correctIndex: number;
    decidedAt: string;
    uniqueSubmitters: number;
    votes: number;
  };
};

type CorrectionsFile = {
  version: 2;
  byQuestion: Record<string, QuestionSuggestions>;
};

function createEmptyCorrectionsFile(): CorrectionsFile {
  return {
    version: 2,
    byQuestion: {},
  };
}

function parseCorrectionsFile(raw: string): CorrectionsFile {
  let parsed: Partial<CorrectionsFile> & { submissions?: LegacyCorrectionSubmission[] };
  try {
    parsed = JSON.parse(raw) as Partial<CorrectionsFile> & {
      submissions?: LegacyCorrectionSubmission[];
    };
  } catch {
    return createEmptyCorrectionsFile();
  }

  // Current schema.
  if (parsed.version === 2 && parsed.byQuestion && typeof parsed.byQuestion === "object") {
    return parsed as CorrectionsFile;
  }

  // Legacy schema migration: { submissions: [...] } -> { byQuestion: ... }
  const migrated = createEmptyCorrectionsFile();
  const legacySubmissions = Array.isArray(parsed.submissions) ? parsed.submissions : [];

  legacySubmissions.forEach((submission, submissionIndex) => {
    const submitterId = `legacy-${submissionIndex + 1}`;
    const date = submission.date ?? new Date().toISOString();

    for (const correction of submission.corrections ?? []) {
      const questionId = correction.questionId;
      if (!questionId) {
        continue;
      }

      const bucket = migrated.byQuestion[questionId] ?? {
        originalIndex: Number.isInteger(correction.originalIndex) ? correction.originalIndex : -1,
        suggestions: [],
      };

      if (bucket.originalIndex < 0 && Number.isInteger(correction.originalIndex)) {
        bucket.originalIndex = correction.originalIndex;
      }

      bucket.suggestions.push({
        date,
        submitterId,
        originalIndex: Number.isInteger(correction.originalIndex) ? correction.originalIndex : -1,
        suggestedIndex: Number.isInteger(correction.newIndex) ? correction.newIndex : -1,
      });

      migrated.byQuestion[questionId] = bucket;
    }
  });

  return migrated;
}

function recomputeAutoCorrection(question: QuestionSuggestions): void {
  // Keep only one vote per submitter (the latest), so one person cannot skew counts.
  const latestBySubmitter = new Map<string, SuggestedCorrection>();
  for (const suggestion of question.suggestions) {
    const previous = latestBySubmitter.get(suggestion.submitterId);
    if (!previous || suggestion.date > previous.date) {
      latestBySubmitter.set(suggestion.submitterId, suggestion);
    }
  }

  const uniqueSubmitters = latestBySubmitter.size;
  if (uniqueSubmitters < AUTO_CORRECTION_MIN_UNIQUE_SUBMITTERS) {
    delete question.autoCorrection;
    return;
  }

  const votesByIndex = new Map<number, number>();
  for (const suggestion of latestBySubmitter.values()) {
    votesByIndex.set(suggestion.suggestedIndex, (votesByIndex.get(suggestion.suggestedIndex) ?? 0) + 1);
  }

  let bestIndex = -1;
  let bestVotes = -1;
  for (const [index, votes] of votesByIndex.entries()) {
    // If tie, keep the smallest index for deterministic behavior.
    if (votes > bestVotes || (votes === bestVotes && index < bestIndex)) {
      bestVotes = votes;
      bestIndex = index;
    }
  }

  question.autoCorrection = {
    correctIndex: bestIndex,
    decidedAt: new Date().toISOString(),
    uniqueSubmitters,
    votes: bestVotes,
  };
}

async function getSubmitterId(): Promise<string> {
  const existing = await AsyncStorage.getItem(LOCAL_SUBMITTER_ID_KEY);
  if (existing && existing.length > 0) {
    return existing;
  }

  const generated = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(LOCAL_SUBMITTER_ID_KEY, generated);
  return generated;
}

export function isSubmitConfigured(): boolean {
  return GITHUB_WRITE_TOKEN.length > 0;
}

/**
 * Appends the user's corrections to data/user-corrections.json in the repo.
 * Creates the file if it doesn't exist yet.
 */
export async function submitCorrectionsToRepo(
  corrections: Record<string, number>,
  originalIndexById: Record<string, number>,
): Promise<void> {
  if (!isSubmitConfigured()) {
    throw new Error("Token no configurado.");
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_CORRECTIONS_FILE}`;
  const baseHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "opos-enfermeria-app",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const makeHeaders = (scheme: "Bearer" | "token"): Record<string, string> => ({
    ...baseHeaders,
    Authorization: `${scheme} ${GITHUB_WRITE_TOKEN}`,
  });

  // 1. Fetch current file to get sha and existing content.
  let currentSha: string | undefined;
  let existing: CorrectionsFile = createEmptyCorrectionsFile();
  const submitterId = await getSubmitterId();

  const getResp = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers: makeHeaders("Bearer") });
  if (getResp.ok) {
    const data = (await getResp.json()) as { sha: string; content: string };
    currentSha = data.sha;
    const decoded = decodeURIComponent(
      Array.from(atob(data.content.replace(/\n/g, "")))
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    existing = parseCorrectionsFile(decoded);
  } else if (getResp.status !== 404) {
    const err = (await getResp.json()) as { message?: string; documentation_url?: string };
    throw new Error(
      `GET ${getResp.status}: ${err.message ?? "Error al leer archivo"}${
        err.documentation_url ? ` | ${err.documentation_url}` : ""
      }`,
    );
  }

  // 2. Append per-question suggestions from this submitter.
  const nowIso = new Date().toISOString();
  for (const [questionId, suggestedIndex] of Object.entries(corrections)) {
    const originalIndex = originalIndexById[questionId] ?? -1;
    const question = existing.byQuestion[questionId] ?? {
      originalIndex,
      suggestions: [],
    };

    if (question.originalIndex < 0 && Number.isInteger(originalIndex)) {
      question.originalIndex = originalIndex;
    }

    // Remove previous vote from this same submitter for this question.
    question.suggestions = question.suggestions.filter((item) => item.submitterId !== submitterId);
    question.suggestions.push({
      date: nowIso,
      submitterId,
      originalIndex,
      suggestedIndex,
    });

    recomputeAutoCorrection(question);
    existing.byQuestion[questionId] = question;
  }

  // 3. Encode and push.
  const json = JSON.stringify(existing, null, 2);
  const encoded = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1: string) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );

  const body: Record<string, unknown> = {
    message: `User corrections report ${new Date().toISOString().slice(0, 10)}`,
    content: encoded,
    branch: GITHUB_BRANCH,
  };
  if (currentSha) body.sha = currentSha;

  const putWithScheme = async (scheme: "Bearer" | "token") =>
    fetch(apiUrl, {
    method: "PUT",
    headers: makeHeaders(scheme),
    body: JSON.stringify(body),
  });

  // Some token types behave better with one auth scheme or the other.
  let putResp = await putWithScheme("Bearer");
  if (putResp.status === 401 || putResp.status === 403) {
    putResp = await putWithScheme("token");
  }

  if (!putResp.ok) {
    const err = (await putResp.json()) as { message?: string; documentation_url?: string };
    const isPermissionsError = putResp.status === 403 &&
      (err.message ?? "").toLowerCase().includes("resource not accessible by personal access token");

    if (isPermissionsError) {
      throw new Error(
        "PUT 403: Token sin permiso para escribir en el repo. " +
          "Revisa fine-grained PAT en el owner correcto, acceso al repo opos-enfermeria-app y Contents=Read and write. " +
          "Si cambiaste token, recuerda rebuild/update de la app.",
      );
    }

    throw new Error(
      `PUT ${putResp.status}: ${err.message ?? "Error al guardar archivo"}${
        err.documentation_url ? ` | ${err.documentation_url}` : ""
      }`,
    );
  }
}
