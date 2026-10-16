import type { ConjugationLanguageConfig } from "@/components/verbs/ConjugationPractice";
import { speak } from "@/lib/shared/speech";
import { buildConjugation } from "./engine";
import { PERSONS, TENSE_OPTIONS, formsFor, type ConjugationTable, type VerbEntry } from "./types";

const TOOLBAR_CHARS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"];

export const germanConjugationConfig: ConjugationLanguageConfig<VerbEntry, ConjugationTable> = {
  languageSlug: "german",
  persons: PERSONS,
  verbGroups: [
    { label: "弱変化(規則)", match: (v) => v.kind === "regular" },
    { label: "強変化・混合変化(不規則)", match: (v) => v.kind === "irregular" },
  ],
  tenseOptions: TENSE_OPTIONS,
  buildConjugation,
  formsFor,
  speak: (text, handlers) => speak(text, "de-DE", handlers),
  toolbarChars: TOOLBAR_CHARS,
  inputPlaceholder: "活用形を入力…",
};
