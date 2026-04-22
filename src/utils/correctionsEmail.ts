import { Linking } from "react-native";
import { Question } from "../types";

const CORRECTIONS_EMAIL = (process.env.EXPO_PUBLIC_CORRECTIONS_EMAIL ?? "").trim();

type CorrectionSubmissionItem = {
  questionId: string;
  originalIndex: number;
  suggestedIndex: number;
  source?: string;
};

function buildCorrectionsPayload(
  corrections: Record<string, number>,
  originalIndexById: Record<string, number>,
  questions: Question[],
): { generatedAt: string; total: number; corrections: CorrectionSubmissionItem[] } {
  const questionById = Object.fromEntries(questions.map((question) => [question.id, question]));

  const items = Object.entries(corrections)
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([questionId, suggestedIndex]) => ({
      questionId,
      originalIndex: originalIndexById[questionId] ?? -1,
      suggestedIndex,
      source: questionById[questionId]?.source,
    }));

  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    corrections: items,
  };
}

export async function sendCorrectionsByEmail(
  corrections: Record<string, number>,
  originalIndexById: Record<string, number>,
  questions: Question[],
): Promise<void> {
  if (Object.keys(corrections).length === 0) {
    throw new Error("No hay correcciones para enviar.");
  }

  const payload = buildCorrectionsPayload(corrections, originalIndexById, questions);

  if (!CORRECTIONS_EMAIL) {
    throw new Error("Falta EXPO_PUBLIC_CORRECTIONS_EMAIL en .env.");
  }

  const subject = `Correcciones app oposiciones (${payload.total})`;
  const body = [
    "Correcciones propuestas desde la app:",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");

  const mailtoUrl = `mailto:${encodeURIComponent(CORRECTIONS_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const supported = await Linking.canOpenURL(mailtoUrl);
  if (!supported) {
    throw new Error("No se pudo abrir la app de correo en este dispositivo.");
  }

  await Linking.openURL(mailtoUrl);
}
