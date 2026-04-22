export type ProfileId = "enfermeria" | "tecnico_superior" | "celador";

export type Profile = {
  id: ProfileId;
  label: string;
  emoji: string;
  description: string;
  commonLabel: string;
  specificLabel: string;
};

export const PROFILES: Profile[] = [
  {
    id: "enfermeria",
    label: "Enfermería",
    emoji: "🏥",
    description: "Temario común (A, B, C1) + preguntas específicas de Enfermería.",
    commonLabel: "Común A, B, C1",
    specificLabel: "Específico Enfermería",
  },
  {
    id: "tecnico_superior",
    label: "Técnico Superior",
    emoji: "💻",
    description: "Temario común (A, B, C1) + preguntas específicas de Técnico Superior.",
    commonLabel: "Común A, B, C1",
    specificLabel: "Específico Técnico Superior",
  },
  {
    id: "celador",
    label: "Celador",
    emoji: "🏃",
    description: "Temario común (C2, C3, D, E) + preguntas específicas de Celador.",
    commonLabel: "Común C2, C3, D, E",
    specificLabel: "Específico Celador",
  },
];

export function getProfileById(id: ProfileId | null): Profile | undefined {
  if (!id) return undefined;
  return PROFILES.find((p) => p.id === id);
}
