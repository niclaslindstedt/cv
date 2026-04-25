import { createContext, useContext } from "react";

import type { Language, LocalizedString } from "../data/cv.types";

export type { Language, LocalizedString };

export const LANG_STORAGE_KEY = "lang";

type UiStrings = {
  present: string;
  months: string[];
  theme: {
    switchToDark: string;
    switchToLight: string;
  };
  hero: {
    downloadAria: string;
    languageEnglish: string;
    languageSwedish: string;
  };
  timeline: {
    title: string;
    hint: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    reset: string;
    close: string;
    closeDetails: string;
    viewOnGitHub: string;
    job: string;
    assignment: string;
    education: string;
    course: string;
    skillsUsed: string;
    noSkills: string;
    starts: string;
    yUnit: string;
    mUnit: string;
    commits: (n: number) => string;
    commitsInYear: (n: number, year: string) => string;
    busiestMonth: string;
    busiestWeek: string;
    busiestDay: string;
    yearRange: (year: string) => string;
  };
  skillModal: {
    project: string;
    role: string;
    assignment: string;
    education: string;
    usageAria: (skill: string) => string;
    close: string;
    empty: string;
    yearsLabel: (years: number) => string;
    benefits: string;
    drawbacks: string;
    learnMore: string;
  };
  experience: {
    assignmentsSummary: (count: number) => string;
  };
  focus: {
    since: string;
    detailAria: (area: string) => string;
  };
};

export const UI_STRINGS: Record<Language, UiStrings> = {
  en: {
    present: "Present",
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    theme: {
      switchToDark: "Switch to dark mode",
      switchToLight: "Switch to light mode",
    },
    hero: {
      downloadAria: "Download CV as PDF (opens print dialog)",
      languageEnglish: "Switch to English",
      languageSwedish: "Switch to Swedish",
    },
    timeline: {
      title: "Career timeline",
      hint: "Ctrl+scroll to zoom · pinch on touch · drag to pan",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      resetZoom: "Reset zoom",
      reset: "Reset",
      close: "Close timeline",
      closeDetails: "Close details",
      viewOnGitHub: "View on GitHub →",
      job: "Job",
      assignment: "Assignment",
      education: "Education",
      course: "Course",
      skillsUsed: "Skills used",
      noSkills: "No skills tagged on this entry.",
      starts: "Starts",
      yUnit: "y",
      mUnit: "m",
      commits: (n) => `${n} commit${n === 1 ? "" : "s"}`,
      commitsInYear: (n, year) => `${n} commit${n === 1 ? "" : "s"} in ${year}`,
      busiestMonth: "Busiest month",
      busiestWeek: "Busiest week",
      busiestDay: "Busiest day",
      yearRange: (year) => `Jan ${year} – Dec ${year}`,
    },
    skillModal: {
      project: "Project",
      role: "Role",
      assignment: "Assignment",
      education: "Education",
      usageAria: (skill) => `${skill} usage`,
      close: "Close",
      empty: "No recorded usage in experience, assignments, or education yet.",
      yearsLabel: (years) => {
        if (years <= 0) return "no recorded experience";
        if (years < 1) return "< 1 year";
        const rounded = Math.round(years);
        return rounded === 1 ? "1 year" : `${rounded} years`;
      },
      benefits: "Strengths",
      drawbacks: "Trade-offs",
      learnMore: "Learn more ↗",
    },
    experience: {
      assignmentsSummary: (n) => `${n} assignment${n === 1 ? "" : "s"}`,
    },
    focus: {
      since: "since",
      detailAria: (area) => `${area} details`,
    },
  },
  sv: {
    present: "Pågående",
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Maj",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dec",
    ],
    theme: {
      switchToDark: "Byt till mörkt läge",
      switchToLight: "Byt till ljust läge",
    },
    hero: {
      downloadAria: "Ladda ner CV som PDF (öppnar utskriftsdialog)",
      languageEnglish: "Byt till engelska",
      languageSwedish: "Byt till svenska",
    },
    timeline: {
      title: "Karriärtidslinje",
      hint: "Ctrl+skroll för att zooma · nyp på pekskärm · dra för att panorera",
      zoomIn: "Zooma in",
      zoomOut: "Zooma ut",
      resetZoom: "Återställ zoom",
      reset: "Återställ",
      close: "Stäng tidslinje",
      closeDetails: "Stäng detaljer",
      viewOnGitHub: "Visa på GitHub →",
      job: "Anställning",
      assignment: "Uppdrag",
      education: "Utbildning",
      course: "Kurs",
      skillsUsed: "Använda kompetenser",
      noSkills: "Inga kompetenser kopplade till denna post.",
      starts: "Startar",
      yUnit: "år",
      mUnit: "mån",
      commits: (n) => `${n} commit${n === 1 ? "" : "s"}`,
      commitsInYear: (n, year) =>
        `${n} commit${n === 1 ? "" : "s"} under ${year}`,
      busiestMonth: "Mest aktiv månad",
      busiestWeek: "Mest aktiv vecka",
      busiestDay: "Mest aktiv dag",
      yearRange: (year) => `Jan ${year} – Dec ${year}`,
    },
    skillModal: {
      project: "Projekt",
      role: "Roll",
      assignment: "Uppdrag",
      education: "Utbildning",
      usageAria: (skill) => `Användning av ${skill}`,
      close: "Stäng",
      empty:
        "Ingen registrerad användning i erfarenhet, uppdrag eller utbildning ännu.",
      yearsLabel: (years) => {
        if (years <= 0) return "ingen registrerad erfarenhet";
        if (years < 1) return "< 1 år";
        const rounded = Math.round(years);
        return rounded === 1 ? "1 år" : `${rounded} år`;
      },
      benefits: "Styrkor",
      drawbacks: "Avvägningar",
      learnMore: "Läs mer ↗",
    },
    experience: {
      assignmentsSummary: (n) => `${n} uppdrag`,
    },
    focus: {
      since: "sedan",
      detailAria: (area) => `Detaljer för ${area}`,
    },
  },
};

export type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (value: LocalizedString) => string;
  ui: UiStrings;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLang must be used within a LanguageProvider");
  }
  return ctx;
}

export function translate(value: LocalizedString, lang: Language): string {
  return value[lang] ?? value.en;
}

export function readInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "en" || stored === "sv") return stored;
  const nav = window.navigator?.language ?? "";
  return nav.toLowerCase().startsWith("sv") ? "sv" : "en";
}
