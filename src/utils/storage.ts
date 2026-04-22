import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStats, Question, QuestionStat } from "../types";
import { ProfileId } from "../constants/profiles";

/**
 * All persisted user progress/state should go through this file to keep
 * storage keys and serialization logic centralized.
 */
type KVStorage = {
  getString: (key: string) => Promise<string | undefined>;
  setString: (key: string, value: string) => Promise<void>;
};

function createStorage(): KVStorage {
  return {
    getString: async (key: string) => {
      const value = await AsyncStorage.getItem(key);
      return value ?? undefined;
    },
    setString: async (key: string, value: string) => {
      await AsyncStorage.setItem(key, value);
    },
  };
}

const storage = createStorage();

// Storage keys (stable names to preserve backward compatibility)
const FAILED_KEY = "failedQuestionIds";
const STATS_KEY = "appStats";
const FAVORITES_KEY = "favoriteQuestionIds";
const QUESTION_STATS_KEY = "questionStats";
const DISABLED_QUESTIONS_KEY = "disabledQuestionIds";
const FONT_SCALE_KEY = "fontScale";
const CORRECT_ANSWER_OVERRIDES_KEY = "correctAnswerOverrides";
const USER_PROFILE_KEY = "userProfile";

const DEFAULT_STATS: AppStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  examsCompleted: 0,
  practiceAnswered: 0,
  practiceCorrect: 0,
  sessionHistory: [],
  examHistoryByProfile: {},
};

// FAILED QUESTIONS
/** Returns persisted failed question IDs. */
export async function getFailedQuestionIds(): Promise<string[]> {
  const raw = await storage.getString(FAILED_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Saves deduplicated failed question IDs. */
export async function saveFailedQuestionIds(ids: string[]): Promise<void> {
  const unique = Array.from(new Set(ids));
  await storage.setString(FAILED_KEY, JSON.stringify(unique));
}

// FAVORITE QUESTIONS
/** Returns persisted favorite question IDs. */
export async function getFavoriteQuestionIds(): Promise<string[]> {
  const raw = await storage.getString(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Saves deduplicated favorite question IDs. */
export async function saveFavoriteQuestionIds(ids: string[]): Promise<void> {
  const unique = Array.from(new Set(ids));
  await storage.setString(FAVORITES_KEY, JSON.stringify(unique));
}

/**
 * Toggles one question ID in the favorites list.
 * Returns true if it becomes favorite after toggle, false otherwise.
 */
export async function toggleFavorite(questionId: string): Promise<boolean> {
  const favorites = await getFavoriteQuestionIds();
  const isFavorite = favorites.includes(questionId);
  
  if (isFavorite) {
    const updated = favorites.filter(id => id !== questionId);
    await saveFavoriteQuestionIds(updated);
    return false;
  } else {
    await saveFavoriteQuestionIds([...favorites, questionId]);
    return true;
  }
}

// STATS
/** Returns global app stats with safe fallbacks. */
export async function getStats(): Promise<AppStats> {
  const raw = await storage.getString(STATS_KEY);
  if (!raw) {
    return DEFAULT_STATS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppStats>;
    const examHistoryByProfile =
      parsed.examHistoryByProfile && typeof parsed.examHistoryByProfile === "object"
        ? parsed.examHistoryByProfile
        : {};

    return {
      totalAnswered: Number(parsed.totalAnswered ?? 0),
      totalCorrect: Number(parsed.totalCorrect ?? 0),
      examsCompleted: Number(parsed.examsCompleted ?? 0),
      practiceAnswered: Number(parsed.practiceAnswered ?? 0),
      practiceCorrect: Number(parsed.practiceCorrect ?? 0),
      lastExamDate: parsed.lastExamDate,
      sessionHistory: Array.isArray(parsed.sessionHistory) ? parsed.sessionHistory : [],
      examHistoryByProfile,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

/** Saves full stats payload. */
export async function saveStats(stats: AppStats): Promise<void> {
  await storage.setString(STATS_KEY, JSON.stringify(stats));
}

// QUESTION STATS (per-question counters)
/** Returns per-question counters map. */
export async function getAllQuestionStats(): Promise<Record<string, QuestionStat>> {
  const raw = await storage.getString(QUESTION_STATS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, QuestionStat>;
  } catch {
    return {};
  }
}

/** Saves entire per-question counters map. */
export async function saveAllQuestionStats(map: Record<string, QuestionStat>): Promise<void> {
  await storage.setString(QUESTION_STATS_KEY, JSON.stringify(map));
}

/**
 * Increments per-question counters for one answered question.
 * Used by both exam and practice flows.
 */
export async function recordQuestionAnswered(
  questionId: string,
  isCorrect: boolean
): Promise<void> {
  const map = await getAllQuestionStats();
  const prev = map[questionId] ?? { id: questionId, timesShown: 0, timesCorrect: 0, timesFailed: 0 };
  map[questionId] = {
    ...prev,
    timesShown: prev.timesShown + 1,
    timesCorrect: prev.timesCorrect + (isCorrect ? 1 : 0),
    timesFailed: prev.timesFailed + (isCorrect ? 0 : 1),
  };
  await saveAllQuestionStats(map);
}

// DISABLED QUESTIONS
/** Returns IDs excluded from random pools. */
export async function getDisabledQuestionIds(): Promise<string[]> {
  const raw = await storage.getString(DISABLED_QUESTIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Saves excluded IDs as-is. */
export async function saveDisabledQuestionIds(ids: string[]): Promise<void> {
  await storage.setString(DISABLED_QUESTIONS_KEY, JSON.stringify(ids));
}

// QUESTION ANSWER CORRECTIONS
/** Returns locally corrected answer indexes keyed by question ID. */
export async function getCorrectAnswerOverrides(): Promise<Record<string, number>> {
  const raw = await storage.getString(CORRECT_ANSWER_OVERRIDES_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "number" && Number.isInteger(value)),
    ) as Record<string, number>;
  } catch {
    return {};
  }
}

/** Saves locally corrected answer indexes keyed by question ID. */
export async function saveCorrectAnswerOverrides(overrides: Record<string, number>): Promise<void> {
  await storage.setString(CORRECT_ANSWER_OVERRIDES_KEY, JSON.stringify(overrides));
}

// UI SETTINGS
/** Returns persisted global font scale with safe clamp. */
export async function getFontScale(): Promise<number> {
  const raw = await storage.getString(FONT_SCALE_KEY);
  if (!raw) return 1;

  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(1.4, Math.max(0.85, parsed));
}

/** Saves global font scale with safety clamp. */
export async function saveFontScale(scale: number): Promise<void> {
  const safeScale = Math.min(1.4, Math.max(0.85, scale));
  await storage.setString(FONT_SCALE_KEY, String(safeScale));
}

// CACHED REMOTE QUESTIONS (per data folder)
const QUESTIONS_FOLDER_CACHE_PREFIX = "cachedQuestionsV2_";
const LAST_QUESTIONS_CHECK_PREFIX = "lastQuestionsCheckMs_";

/** Returns cached questions for a specific data folder (e.g. "A_B_C1"), or null. */
export async function getCachedQuestionsForFolder(folder: string): Promise<Question[] | null> {
  const raw = await storage.getString(QUESTIONS_FOLDER_CACHE_PREFIX + folder);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Question[]) : null;
  } catch {
    return null;
  }
}

/** Saves fetched questions for a specific data folder. */
export async function saveCachedQuestionsForFolder(folder: string, questions: Question[]): Promise<void> {
  await storage.setString(QUESTIONS_FOLDER_CACHE_PREFIX + folder, JSON.stringify(questions));
}

/** Returns the timestamp (ms) of the last successful question update for a profile. */
export async function getLastQuestionsCheckMs(profileId: string): Promise<number> {
  const raw = await storage.getString(LAST_QUESTIONS_CHECK_PREFIX + profileId);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
}

/** Saves the current timestamp as the last successful question update for a profile. */
export async function saveLastQuestionsCheckMs(profileId: string): Promise<void> {
  await storage.setString(LAST_QUESTIONS_CHECK_PREFIX + profileId, String(Date.now()));
}

// USER PROFILE
/** Returns the selected oposicion profile, or null if not yet chosen. */
export async function getUserProfile(): Promise<ProfileId | null> {
  const raw = await storage.getString(USER_PROFILE_KEY);
  if (!raw) return null;
  return raw as ProfileId;
}

/** Saves the selected oposicion profile. */
export async function saveUserProfile(profileId: ProfileId): Promise<void> {
  await storage.setString(USER_PROFILE_KEY, profileId);
}
