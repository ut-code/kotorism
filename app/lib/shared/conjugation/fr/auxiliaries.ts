import type { SixForms } from "./types";

interface AuxiliaryForms {
  présent: SixForms;
  imparfait: SixForms;
  futurSimple: SixForms;
  conditionnelPrésent: SixForms;
  subjonctifPrésent: SixForms;
}

export const AVOIR_FORMS: AuxiliaryForms = {
  présent: ["ai", "as", "a", "avons", "avez", "ont"],
  imparfait: ["avais", "avais", "avait", "avions", "aviez", "avaient"],
  futurSimple: ["aurai", "auras", "aura", "aurons", "aurez", "auront"],
  conditionnelPrésent: ["aurais", "aurais", "aurait", "aurions", "auriez", "auraient"],
  subjonctifPrésent: ["aie", "aies", "ait", "ayons", "ayez", "aient"],
};

export const ETRE_FORMS: AuxiliaryForms = {
  présent: ["suis", "es", "est", "sommes", "êtes", "sont"],
  imparfait: ["étais", "étais", "était", "étions", "étiez", "étaient"],
  futurSimple: ["serai", "seras", "sera", "serons", "serez", "seront"],
  conditionnelPrésent: ["serais", "serais", "serait", "serions", "seriez", "seraient"],
  subjonctifPrésent: ["sois", "sois", "soit", "soyons", "soyez", "soient"],
};
