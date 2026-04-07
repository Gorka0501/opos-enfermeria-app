import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStats } from "../types";

const FAILED_KEY = "failedQuestionIds";
const STATS_KEY = "appStats";

const DEFAULT_STATS: AppStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  examsCompleted: 0,
  practiceAnswered: 0,
  practiceCorrect: 0,
};

export async function getFailedQuestionIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAILED_KEY);
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

export async function saveFailedQuestionIds(ids: string[]): Promise<void> {
  const unique = Array.from(new Set(ids));
  await AsyncStorage.setItem(FAILED_KEY, JSON.stringify(unique));
}

export async function getStats(): Promise<AppStats> {
  const raw = await AsyncStorage.getItem(STATS_KEY);
  if (!raw) {
    return DEFAULT_STATS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppStats>;
    return {
      totalAnswered: Number(parsed.totalAnswered ?? 0),
      totalCorrect: Number(parsed.totalCorrect ?? 0),
      examsCompleted: Number(parsed.examsCompleted ?? 0),
      practiceAnswered: Number(parsed.practiceAnswered ?? 0),
      practiceCorrect: Number(parsed.practiceCorrect ?? 0),
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export async function saveStats(stats: AppStats): Promise<void> {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
