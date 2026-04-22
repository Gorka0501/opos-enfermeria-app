import { Question } from "../types";
import { saveCachedQuestionsForFolder, saveLastQuestionsCheckMs } from "./storage";

const GITHUB_OWNER = "Gorka0501";
const GITHUB_REPO = "opos-enfermeria-app";
const GITHUB_BRANCH = "main";

/** Maps each profile to the data folders it needs. */
export const PROFILE_FOLDERS: Record<string, string[]> = {
  enfermeria: ["A_B_C1", "Enfermeria"],
  tecnico_superior: ["A_B_C1", "Tecnico_Superior"],
  celador: ["C2_C3_D_E", "Celador"],
};

/** 24 hours in milliseconds — interval between automatic checks. */
export const QUESTIONS_AUTO_UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Timeout for each individual folder fetch. */
const FETCH_TIMEOUT_MS = 15_000;

function isValidQuestion(item: unknown): item is Question {
  if (typeof item !== "object" || item === null) return false;
  const q = item as Record<string, unknown>;
  return (
    typeof q.id === "string" &&
    typeof q.question === "string" &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    typeof q.correctIndex === "number" &&
    Number.isInteger(q.correctIndex) &&
    q.correctIndex >= 0 &&
    q.correctIndex < (q.options as unknown[]).length
  );
}

async function fetchFolderQuestions(folder: string): Promise<Question[]> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/${folder}/questions.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} al descargar preguntas de ${folder}`);
  }
  const data = (await resp.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(`Respuesta inválida para la carpeta ${folder}`);
  }
  const valid = data.filter(isValidQuestion);
  if (valid.length === 0) {
    throw new Error(`Sin preguntas válidas en la carpeta ${folder}`);
  }
  return valid;
}

/**
 * Downloads all question folders for the given profile from GitHub,
 * caches each folder individually, records the update timestamp,
 * and returns the merged question array.
 */
export async function updateQuestionsForProfile(profileId: string): Promise<Question[]> {
  const folders = PROFILE_FOLDERS[profileId] ?? [];
  if (folders.length === 0) {
    throw new Error(`Perfil desconocido: ${profileId}`);
  }

  const parts = await Promise.all(
    folders.map(async (folder) => {
      const questions = await fetchFolderQuestions(folder);
      await saveCachedQuestionsForFolder(folder, questions);
      return questions;
    }),
  );

  await saveLastQuestionsCheckMs(profileId);
  return parts.flat();
}
