import type { ConjugationLanguageConfig } from "@/components/verbs/ConjugationPractice";
import { speak } from "@/lib/shared/speech";
import { buildConjugation } from "./engine";
import { PERSONS, TENSE_OPTIONS, formsFor, type ConjugationTable, type VerbEntry } from "./types";

const TOOLBAR_CHARS = ["é", "è", "ê", "ë", "à", "â", "î", "ï", "ô", "ù", "û", "ç"];

export const frenchConjugationConfig: ConjugationLanguageConfig<VerbEntry, ConjugationTable> = {
  languageSlug: "french",
  persons: PERSONS,
  verbGroups: [
    { label: "第1群(-er)", match: (v) => v.kind === "regular" && v.group === 1 },
    { label: "第2群(-ir)", match: (v) => v.kind === "regular" && v.group === 2 },
    { label: "第3群(規則)", match: (v) => v.kind === "regular" && v.group === 3 },
    { label: "不規則動詞", match: (v) => v.kind === "irregular" },
  ],
  tenseOptions: TENSE_OPTIONS,
  buildConjugation,
  formsFor,
  speak: (text, handlers) => speak(text, "fr-FR", handlers),
  toolbarChars: TOOLBAR_CHARS,
  inputPlaceholder: "活用形を入力…",
};
