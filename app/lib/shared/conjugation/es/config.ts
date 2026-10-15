import type { ConjugationLanguageConfig } from "@/components/verbs/ConjugationPractice";
import { speak } from "@/lib/shared/speech";
import { buildConjugation } from "./engine";
import { PERSONS, TENSE_OPTIONS, formsFor, type ConjugationTable, type VerbEntry } from "./types";

const ACCENT_CYCLES: string[][] = [
  ["a", "á"],
  ["e", "é"],
  ["i", "í"],
  ["o", "ó"],
  ["u", "ú", "ü"],
  ["n", "ñ"],
];

const TOOLBAR_CHARS = ["á", "é", "í", "ó", "ú", "ü", "ñ"];

export const spanishConjugationConfig: ConjugationLanguageConfig<VerbEntry, ConjugationTable> = {
  persons: PERSONS,
  verbGroups: [
    { label: "規則 -ar", match: (v) => v.kind === "regular" && v.group === "ar" },
    { label: "規則 -er", match: (v) => v.kind === "regular" && v.group === "er" },
    { label: "規則 -ir", match: (v) => v.kind === "regular" && v.group === "ir" },
    { label: "不規則動詞", match: (v) => v.kind === "irregular" },
  ],
  tenseOptions: TENSE_OPTIONS,
  buildConjugation,
  formsFor,
  speak: (text, handlers) => speak(text, "es-ES", handlers),
  accentCycles: ACCENT_CYCLES,
  toolbarChars: TOOLBAR_CHARS,
  inputPlaceholder: "活用形を入力...",
};
