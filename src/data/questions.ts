import { ProfileId } from "../constants/profiles";
import { Question } from "../types";
import { getCachedQuestionsForFolder } from "../utils/storage";
import { PROFILE_FOLDERS } from "../utils/remoteQuestions";

import rawABC1 from "../../data/A_B_C1/questions.json";
import rawC2C3DE from "../../data/C2_C3_D_E/questions.json";
import rawCelador from "../../data/Celador/questions.json";
import rawEnfermeria from "../../data/Enfermeria/questions.json";
import rawTecnicoSuperior from "../../data/Tecnico_Superior/questions.json";

/** Bundled static questions, used as fallback when no remote cache exists. */
const STATIC_QUESTIONS: Record<string, Question[]> = {
  A_B_C1: rawABC1 as Question[],
  C2_C3_D_E: rawC2C3DE as Question[],
  Celador: rawCelador as Question[],
  Enfermeria: rawEnfermeria as Question[],
  Tecnico_Superior: rawTecnicoSuperior as Question[],
};

/**
 * Returns the combined question pool for the given profile (synchronous).
 * Always uses bundled static data — use loadQuestionsForProfile() when you
 * want to prefer the remotely cached version.
 *
 * - enfermeria:       A_B_C1 + Enfermeria
 * - tecnico_superior: A_B_C1 + Tecnico_Superior
 * - celador:          C2_C3_D_E + Celador
 */
export function getQuestionsForProfile(profileId: ProfileId): Question[] {
  switch (profileId) {
    case "enfermeria":
      return [...(rawABC1 as Question[]), ...(rawEnfermeria as Question[])];
    case "tecnico_superior":
      return [...(rawABC1 as Question[]), ...(rawTecnicoSuperior as Question[])];
    case "celador":
      return [...(rawC2C3DE as Question[]), ...(rawCelador as Question[])];
    default:
      return rawEnfermeria as Question[];
  }
}

/**
 * Async version that returns cached remote questions when available,
 * falling back to bundled static data per folder.
 */
export async function loadQuestionsForProfile(profileId: ProfileId): Promise<Question[]> {
  const folders = PROFILE_FOLDERS[profileId] ?? [];
  if (folders.length === 0) return getQuestionsForProfile(profileId);

  const parts = await Promise.all(
    folders.map(async (folder) => {
      const cached = await getCachedQuestionsForFolder(folder);
      return cached ?? STATIC_QUESTIONS[folder] ?? [];
    }),
  );
  return parts.flat();
}
