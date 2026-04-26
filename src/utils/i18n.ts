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
    light: string;
    dark: string;
  };
  hero: {
    eyebrow: string;
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
    viewRepository: string;
    job: string;
    assignment: string;
    education: string;
    course: string;
    sideProject: string;
    skillsUsed: string;
    starts: string;
    yUnit: string;
    mUnit: string;
    commits: (n: number) => string;
    commitsInYear: (n: number, year: string) => string;
    busiestMonth: string;
    busiestWeek: string;
    busiestDay: string;
    busiestRepo: string;
    yearRange: (year: string) => string;
    promotedTo: (title: string, date: string) => string;
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
  companyModal: {
    detailAria: (company: string) => string;
    visitWebsite: string;
    stack: string;
    terminated: string;
  };
  summaryModal: {
    detailAria: (name: string) => string;
    readMore: string;
  };
  projectModal: {
    detailAria: (project: string) => string;
    viewOnGitHub: string;
    viewOnDockerHub: string;
    viewOnCratesIo: string;
    viewOnPyPI: string;
    viewOnNpm: string;
    visitSite: string;
    active: string;
    commits: string;
    stack: string;
  };
  programModal: {
    coursesHeading: string;
    coursesAria: (program: string) => string;
    coursesSummary: (count: number) => string;
    grade: string;
    completed: string;
    inProgress: string;
    close: string;
    moments: string;
    momentNotCompleted: string;
    courseProgress: (earned: string, total: string) => string;
    incomplete: string;
  };
  education: {
    viewCoursesAria: (program: string) => string;
    coursesCount: (count: number) => string;
  };
  skills: {
    emptyTooltip: string;
    personalInterest: string;
    personalInterestTooltip: string;
  };
  courses: {
    viewMomentsAria: (course: string) => string;
    momentsAria: (course: string) => string;
    momentsCount: (count: number) => string;
  };
  section: {
    expand: (title: string) => string;
    collapse: (title: string) => string;
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
      light: "Light mode",
      dark: "Dark mode",
    },
    hero: {
      eyebrow: "Resume",
      downloadAria: "Download CV as PDF",
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
      viewRepository: "View repository →",
      job: "Job",
      assignment: "Assignment",
      education: "Education",
      course: "Course",
      sideProject: "Side project",
      skillsUsed: "Skills used",
      starts: "Starts",
      yUnit: "y",
      mUnit: "m",
      commits: (n) => `${n} commit${n === 1 ? "" : "s"}`,
      commitsInYear: (n, year) => `${n} commit${n === 1 ? "" : "s"} in ${year}`,
      busiestMonth: "Busiest month",
      busiestWeek: "Busiest week",
      busiestDay: "Busiest day",
      busiestRepo: "Busiest repo",
      yearRange: (year) => `Jan ${year} – Dec ${year}`,
      promotedTo: (title, date) => `Promoted to ${title} · ${date}`,
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
    companyModal: {
      detailAria: (company) => `${company} details`,
      visitWebsite: "Visit website ↗",
      stack: "Stack",
      terminated: "Terminated",
    },
    summaryModal: {
      detailAria: (name) => `${name} — full summary`,
      readMore: "Read more →",
    },
    projectModal: {
      detailAria: (project) => `${project} details`,
      viewOnGitHub: "View on GitHub ↗",
      viewOnDockerHub: "View on Docker Hub ↗",
      viewOnCratesIo: "View on crates.io ↗",
      viewOnPyPI: "View on PyPI ↗",
      viewOnNpm: "View on npm ↗",
      visitSite: "Visit site ↗",
      active: "Active",
      commits: "Commits",
      stack: "Stack",
    },
    programModal: {
      coursesHeading: "Courses",
      coursesAria: (program) => `${program} courses`,
      coursesSummary: (n) => `${n} course${n === 1 ? "" : "s"}`,
      grade: "Grade",
      completed: "Completed",
      inProgress: "In progress",
      close: "Close",
      moments: "Components",
      momentNotCompleted: "Not completed",
      courseProgress: (earned, total) => `${earned} of ${total} earned`,
      incomplete: "Incomplete",
    },
    education: {
      viewCoursesAria: (program) => `View courses for ${program}`,
      coursesCount: (n) => `${n} course${n === 1 ? "" : "s"}`,
    },
    skills: {
      emptyTooltip: "No entries yet",
      personalInterest: "Personal interest",
      personalInterestTooltip:
        "Self-directed: not yet used in a job, assignment, or project.",
    },
    courses: {
      viewMomentsAria: (course) => `View components for ${course}`,
      momentsAria: (course) => `${course} components`,
      momentsCount: (n) => `${n} component${n === 1 ? "" : "s"}`,
    },
    section: {
      expand: (title) => `Expand ${title} section`,
      collapse: (title) => `Collapse ${title} section`,
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
      light: "Ljust läge",
      dark: "Mörkt läge",
    },
    hero: {
      eyebrow: "CV",
      downloadAria: "Ladda ner CV som PDF",
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
      viewRepository: "Visa repo →",
      job: "Anställning",
      assignment: "Uppdrag",
      education: "Utbildning",
      course: "Kurs",
      sideProject: "Sidoprojekt",
      skillsUsed: "Använda kompetenser",
      starts: "Startar",
      yUnit: "år",
      mUnit: "mån",
      commits: (n) => `${n} commit${n === 1 ? "" : "s"}`,
      commitsInYear: (n, year) =>
        `${n} commit${n === 1 ? "" : "s"} under ${year}`,
      busiestMonth: "Mest aktiv månad",
      busiestWeek: "Mest aktiv vecka",
      busiestDay: "Mest aktiv dag",
      busiestRepo: "Mest aktiva repo",
      yearRange: (year) => `Jan ${year} – Dec ${year}`,
      promotedTo: (title, date) => `Befordrad till ${title} · ${date}`,
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
    companyModal: {
      detailAria: (company) => `Detaljer för ${company}`,
      visitWebsite: "Besök webbplats ↗",
      stack: "Stack",
      terminated: "Avvecklat",
    },
    summaryModal: {
      detailAria: (name) => `${name} — fullständig sammanfattning`,
      readMore: "Läs mer →",
    },
    projectModal: {
      detailAria: (project) => `Detaljer för ${project}`,
      viewOnGitHub: "Visa på GitHub ↗",
      viewOnDockerHub: "Visa på Docker Hub ↗",
      viewOnCratesIo: "Visa på crates.io ↗",
      viewOnPyPI: "Visa på PyPI ↗",
      viewOnNpm: "Visa på npm ↗",
      visitSite: "Besök sajten ↗",
      active: "Aktiv",
      commits: "Commits",
      stack: "Stack",
    },
    programModal: {
      coursesHeading: "Kurser",
      coursesAria: (program) => `Kurser i ${program}`,
      coursesSummary: (n) => (n === 1 ? "1 kurs" : `${n} kurser`),
      grade: "Betyg",
      completed: "Avklarad",
      inProgress: "Pågående",
      close: "Stäng",
      moments: "Moment",
      momentNotCompleted: "Ej avklarat",
      courseProgress: (earned, total) => `${earned} av ${total} avklarat`,
      incomplete: "Ej avklarad",
    },
    education: {
      viewCoursesAria: (program) => `Visa kurser för ${program}`,
      coursesCount: (n) => (n === 1 ? "1 kurs" : `${n} kurser`),
    },
    skills: {
      emptyTooltip: "Inga poster ännu",
      personalInterest: "Personligt intresse",
      personalInterestTooltip:
        "Eget intresse: ännu inte använt i ett jobb, uppdrag eller projekt.",
    },
    courses: {
      viewMomentsAria: (course) => `Visa moment för ${course}`,
      momentsAria: (course) => `Moment i ${course}`,
      momentsCount: (n) => (n === 1 ? "1 moment" : `${n} moment`),
    },
    section: {
      expand: (title) => `Expandera ${title.toLowerCase()}`,
      collapse: (title) => `Fäll ihop ${title.toLowerCase()}`,
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
