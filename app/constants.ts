export type ConsultationType =
  | "INITIAL"
  | "TREATMENT"
  | "POST_TREATMENT"
  | "OTHER";

export type ConsultationOption = { label: string; value: ConsultationType };

export const CONSULTATION_OPTIONS: ConsultationOption[] = [
  { label: "Initial", value: "INITIAL" },
  { label: "Treatment", value: "TREATMENT" },
  { label: "Post Treatment", value: "POST_TREATMENT" },
  { label: "Other", value: "OTHER" },
];
