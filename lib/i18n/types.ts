export type Locale = "en" | "zh" | "es" | "ar" | "fr" | "pt" | "ru";

export const DEFAULT_LOCALE: Locale = "en";

export interface LocaleInfo {
  code: Locale;
  label: string;       // short label for picker
  nativeName: string;  // name in its own language
}

export const LOCALES: LocaleInfo[] = [
  { code: "en", label: "EN", nativeName: "English" },
  { code: "zh", label: "ZH", nativeName: "中文" },
  { code: "es", label: "ES", nativeName: "Español" },
  { code: "ar", label: "AR", nativeName: "العربية" },
  { code: "fr", label: "FR", nativeName: "Français" },
  { code: "pt", label: "PT", nativeName: "Português" },
  { code: "ru", label: "RU", nativeName: "Русский" },
];

/** Flat translation dictionary. All keys listed here. */
export interface Translations {
  // ─── Common ───
  "common.loadingGame": string;
  "common.loadingMap": string;
  "common.generatingRoute": string;
  "common.playAgain": string;
  "common.home": string;
  "common.comingSoon": string;
  "common.go": string;

  // ─── Home ───
  "home.subtitle": string;
  "home.footer": string;
  "home.connectTitle": string;
  "home.connectDesc": string;
  "home.silhouetteTitle": string;
  "home.silhouetteDesc": string;
  "home.flagsTitle": string;
  "home.flagsDesc": string;
  "home.capitalsTitle": string;
  "home.capitalsDesc": string;

  // ─── Difficulty ───
  "difficulty.easy": string;
  "difficulty.easyDesc": string;
  "difficulty.medium": string;
  "difficulty.mediumDesc": string;
  "difficulty.hard": string;
  "difficulty.hardDesc": string;

  // ─── Continent ───
  "continent.all": string;
  "continent.europe": string;
  "continent.asia": string;
  "continent.africa": string;
  "continent.northAmerica": string;
  "continent.southAmerica": string;

  // ─── Game: Reveal Phase ───
  "reveal.mode": string;
  "reveal.start": string;
  "reveal.end": string;
  "reveal.planRoute": string;

  // ─── Game: Execution Phase ───
  "execution.move": string;
  "execution.total": string;
  "execution.currentlyAt": string;
  "execution.reachNeighborOf": string;
  "execution.toWin": string;
  "execution.hintTry": string;
  "execution.hintTooltip": string;
  "execution.skipTooltip": string;
  "execution.skipLocked": string;
  "execution.typePlaceholder": string;
  "execution.neighbor": string;

  // ─── Game: Resolution Phase ───
  "resolution.timeUp": string;
  "resolution.totalScore": string;
  "resolution.lowerIsBetter": string;
  "resolution.movesTaken": string;
  "resolution.optimalPath": string;
  "resolution.wrongPenalty": string;
  "resolution.hintsPenalty": string;
  "resolution.timeoutPenalty": string;
  "resolution.efficiency": string;
  "resolution.moves": string;

  // ─── Ratings ───
  "rating.perfect": string;
  "rating.great": string;
  "rating.good": string;
  "rating.ok": string;
  "rating.keepTrying": string;

  // ─── Score Display ───
  "score.label": string;
  "score.penalty": string;
  "score.hints": string;

  // ─── Move History ───
  "history.title": string;
  "history.notNeighbor": string;
  "history.alreadyVisited": string;
  "history.startTyping": string;

  // ─── Silhouette Game ───
  "silhouette.round": string;
  "silhouette.points": string;
  "silhouette.finalScore": string;
  "silhouette.roundsSolved": string;
  "silhouette.roundsSkipped": string;
  "silhouette.hintsUsed": string;
  "silhouette.wrongGuesses": string;
  "silhouette.roundReview": string;
  "silhouette.nextRound": string;
  "silhouette.seeResults": string;
  "silhouette.skippedLabel": string;
  "silhouette.timeUpLabel": string;
  "silhouette.getHint": string;
  "silhouette.skip": string;
  "silhouette.hintContinent": string;
  "silhouette.hintFirstLetter": string;
  "silhouette.hintCapital": string;
  "silhouette.hintNeighbors": string;

  // ─── Flag Sprint Game ───
  "flags.getReady": string;
  "flags.placeholder": string;
  "flags.skip": string;
  "flags.correct": string;
  "flags.wrong": string;
  "flags.bestStreak": string;
  "flags.accuracy": string;
  "flags.answers": string;

  // ─── Difficulty Info (on game cards) ───
  "flags.diffCountries": string;
  "flags.diffRounds": string;
  "flags.diffEach": string;
  "flags.diffWrong": string;

  // ─── Capital Clash Game ───
  "capitals.getReady": string;
  "capitals.whatCapital": string;
  "capitals.whatCountry": string;
  "capitals.typeCapital": string;
  "capitals.typeCountry": string;
  "capitals.diffMixed": string;
  "capitals.diffOneWay": string;
}
