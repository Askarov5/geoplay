import type { Locale } from "../types";
import en from "./en";
import zh from "./zh";
import es from "./es";
import ar from "./ar";
import fr from "./fr";
import pt from "./pt";
import ru from "./ru";

export const countryNames: Record<Locale, Record<string, string>> = {
  en,
  zh,
  es,
  ar,
  fr,
  pt,
  ru,
};
