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

async function fetchFolderQuestions(folder: string): Promise<Question[]> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/${folder}/questions.json`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} al descargar preguntas de ${folder}`);
  }
  const data = (await resp.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(`Respuesta inválida para la carpeta ${folder}`);
  }
  return data as Question[];
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
