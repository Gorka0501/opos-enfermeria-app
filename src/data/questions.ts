import { ProfileId } from "../constants/profiles";
import { Question } from "../types";

import rawABC1 from "../../data/A_B_C1/questions.json";
import rawC2C3DE from "../../data/C2_C3_D_E/questions.json";
import rawCelador from "../../data/Celador/questions.json";
import rawEnfermeria from "../../data/Enfermeria/questions.json";
import rawTecnicoSuperior from "../../data/Tecnico_Superior/questions.json";

// Kept for backward compatibility with any code that still imports this.
export const QUESTION_POOL: Question[] = rawEnfermeria as Question[];

/**
 * Returns the combined question pool for the given profile:
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
