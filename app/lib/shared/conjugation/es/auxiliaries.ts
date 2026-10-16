import type { SixForms } from "./types";

interface HaberForms {
  presente: SixForms;
  pretéritoImperfecto: SixForms;
  futuroSimple: SixForms;
  condicionalSimple: SixForms;
  subjuntivoPresente: SixForms;
}

// スペイン語の完了時制はhaber（フランス語のavoir/êtreのような使い分けはなく常にhaber）のみを使う
export const HABER_FORMS: HaberForms = {
  presente: ["he", "has", "ha", "hemos", "habéis", "han"],
  pretéritoImperfecto: ["había", "habías", "había", "habíamos", "habíais", "habían"],
  futuroSimple: ["habré", "habrás", "habrá", "habremos", "habréis", "habrán"],
  condicionalSimple: ["habría", "habrías", "habría", "habríamos", "habríais", "habrían"],
  subjuntivoPresente: ["haya", "hayas", "haya", "hayamos", "hayáis", "hayan"],
};
