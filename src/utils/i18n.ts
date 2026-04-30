import { createContext, useContext } from "react";

import type { Language, LocalizedString } from "../data/cv.types";
import type { SearchKind } from "../data/search-index.types";

export type { Language, LocalizedString };

export const LANG_STORAGE_KEY = "lang";

type UiStrings = {
  present: string;
  skipToContent: string;
  months: string[];
  theme: {
    label: string;
    switchToDark: string;
    switchToLight: string;
    light: string;
    dark: string;
  };
  hero: {
    eyebrow: string;
    timeline: string;
    pdf: string;
    downloadAria: string;
    languageLabel: string;
    languageEnglish: string;
    languageSwedish: string;
  };
  timeline: {
    title: string;
    hint: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    close: string;
    closeDetails: string;
    previousDetails: string;
    nextDetails: string;
    viewOnGitHub: string;
    viewRepository: string;
    job: string;
    assignment: string;
    education: string;
    course: string;
    sideProject: string;
    skillsUsed: string;
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
    projectsHeading: string;
    jobsHeading: string;
    assignmentsHeading: string;
    educationHeading: string;
    coursesHeading: string;
    unusedHeading: string;
    unusedHint: string;
    via: string;
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
    assignmentsHeading: string;
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
  experienceModal: {
    detailAria: (title: string) => string;
    assignmentAria: (title: string) => string;
    via: (company: string) => string;
    aboutCompany: (company: string) => string;
    aboutClient: (company: string) => string;
    visitCompanyWebsite: (company: string) => string;
    skills: string;
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
    viewOnNuGet: string;
    visitSite: string;
    active: string;
    commits: string;
    stack: string;
    skills: string;
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
    unusedStack: string;
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
  search: {
    open: string;
    shortcutHint: string;
    placeholder: string;
    close: string;
    dialogAria: string;
    inputAria: string;
    emptyHint: string;
    noResults: (query: string) => string;
    resultCountAria: (count: number) => string;
    kindLabels: Record<SearchKind, string>;
  };
};

export const UI_STRINGS: Record<Language, UiStrings> = {
  en: {
    present: "Present",
    skipToContent: "Skip to main content",
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
      label: "Theme",
      switchToDark: "Switch to dark mode",
      switchToLight: "Switch to light mode",
      light: "Light mode",
      dark: "Dark mode",
    },
    hero: {
      eyebrow: "Resume",
      timeline: "Timeline",
      pdf: "PDF",
      downloadAria: "Download CV as PDF",
      languageLabel: "Language",
      languageEnglish: "Switch to English",
      languageSwedish: "Switch to Swedish",
    },
    timeline: {
      title: "Career timeline",
      hint: "Drag to pan · use −/+ or pinch to zoom",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      resetZoom: "Reset zoom",
      close: "Close timeline",
      closeDetails: "Close details",
      previousDetails: "Previous",
      nextDetails: "Next",
      viewOnGitHub: "View on GitHub →",
      viewRepository: "View repository →",
      job: "Job",
      assignment: "Assignment",
      education: "Education",
      course: "Course",
      sideProject: "Side project",
      skillsUsed: "Skills used",
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
      projectsHeading: "Projects",
      jobsHeading: "Jobs",
      assignmentsHeading: "Assignments",
      educationHeading: "Education",
      coursesHeading: "Courses",
      unusedHeading: "On the stack but not personally practiced",
      unusedHint:
        "Listed in the stack at these places but never personally practiced.",
      via: "via",
      usageAria: (skill) => `${skill} usage`,
      close: "Close",
      empty:
        "No recorded usage in experience, assignments, education, or courses yet.",
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
      assignmentsHeading: "Assignments",
    },
    focus: {
      since: "since",
      detailAria: (area) => `${area} details`,
    },
    companyModal: {
      detailAria: (company) => `${company} details`,
      visitWebsite: "Visit website ↗",
      stack: "Stack",
      terminated: "Discontinued",
    },
    experienceModal: {
      detailAria: (title) => `${title} — experience details`,
      assignmentAria: (title) => `${title} — assignment details`,
      via: (company) => `via ${company}`,
      aboutCompany: (company) => `About ${company}`,
      aboutClient: (company) => `About ${company}`,
      visitCompanyWebsite: (company) => `Visit ${company} ↗`,
      skills: "Skills",
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
      viewOnNuGet: "View on NuGet ↗",
      visitSite: "Visit site ↗",
      active: "Active",
      commits: "Commits",
      stack: "Stack",
      skills: "Skills",
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
      unusedStack: "Part of the stack but not personally practiced",
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
    search: {
      open: "Search",
      shortcutHint: "⌘K",
      placeholder: "Search the CV…",
      close: "Close search",
      dialogAria: "Search the CV",
      inputAria: "Search query",
      emptyHint: "Type to search across roles, projects, skills, and more.",
      noResults: (query) => `No matches for “${query}”.`,
      resultCountAria: (n) =>
        n === 1 ? "1 search result" : `${n} search results`,
      kindLabels: {
        project: "Project",
        company: "Company",
        experience: "Experience",
        assignment: "Assignment",
        education: "Education",
        course: "Course",
        skill: "Skill",
        focus: "Focus",
        summary: "About",
      },
    },
  },
  sv: {
    present: "Pågående",
    skipToContent: "Hoppa till huvudinnehåll",
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
      label: "Tema",
      switchToDark: "Byt till mörkt läge",
      switchToLight: "Byt till ljust läge",
      light: "Ljust läge",
      dark: "Mörkt läge",
    },
    hero: {
      eyebrow: "CV",
      timeline: "Tidslinje",
      pdf: "PDF",
      downloadAria: "Ladda ner CV som PDF",
      languageLabel: "Språk",
      languageEnglish: "Byt till engelska",
      languageSwedish: "Byt till svenska",
    },
    timeline: {
      title: "Karriärtidslinje",
      hint: "Dra för att panorera · använd −/+ eller nyp för att zooma",
      zoomIn: "Zooma in",
      zoomOut: "Zooma ut",
      resetZoom: "Återställ zoom",
      close: "Stäng tidslinje",
      closeDetails: "Stäng detaljer",
      previousDetails: "Föregående",
      nextDetails: "Nästa",
      viewOnGitHub: "Visa på GitHub →",
      viewRepository: "Visa repo →",
      job: "Anställning",
      assignment: "Uppdrag",
      education: "Utbildning",
      course: "Kurs",
      sideProject: "Sidoprojekt",
      skillsUsed: "Använda kompetenser",
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
      projectsHeading: "Projekt",
      jobsHeading: "Anställningar",
      assignmentsHeading: "Uppdrag",
      educationHeading: "Utbildning",
      coursesHeading: "Kurser",
      unusedHeading: "Ingick i stacken men inte personligt utövad",
      unusedHint:
        "Fanns i stacken på dessa ställen men har aldrig utövats personligen.",
      via: "via",
      usageAria: (skill) => `Användning av ${skill}`,
      close: "Stäng",
      empty:
        "Ingen registrerad användning i erfarenhet, uppdrag, utbildning eller kurser ännu.",
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
      assignmentsHeading: "Uppdrag",
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
    experienceModal: {
      detailAria: (title) => `${title} — anställningsdetaljer`,
      assignmentAria: (title) => `${title} — uppdragsdetaljer`,
      via: (company) => `via ${company}`,
      aboutCompany: (company) => `Om ${company}`,
      aboutClient: (company) => `Om ${company}`,
      visitCompanyWebsite: (company) => `Besök ${company} ↗`,
      skills: "Kompetenser",
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
      viewOnNuGet: "Visa på NuGet ↗",
      visitSite: "Besök sajten ↗",
      active: "Aktiv",
      commits: "Commits",
      stack: "Stack",
      skills: "Kompetenser",
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
      unusedStack: "Ingick i stacken men inte personligt utövad",
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
    search: {
      open: "Sök",
      shortcutHint: "⌘K",
      placeholder: "Sök i CV:n…",
      close: "Stäng sökning",
      dialogAria: "Sök i CV:n",
      inputAria: "Sökfråga",
      emptyHint: "Skriv för att söka i roller, projekt, kompetenser med mera.",
      noResults: (query) => `Inga träffar för ”${query}”.`,
      resultCountAria: (n) => (n === 1 ? "1 sökträff" : `${n} sökträffar`),
      kindLabels: {
        project: "Projekt",
        company: "Företag",
        experience: "Erfarenhet",
        assignment: "Uppdrag",
        education: "Utbildning",
        course: "Kurs",
        skill: "Kompetens",
        focus: "Fokus",
        summary: "Om",
      },
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
  // A `?lang=en|sv` query param wins over stored/browser preference. The
  // PDF generator relies on this to render one PDF per language; it also
  // makes shareable language-pinned links work.
  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get("lang");
  if (queryLang === "en" || queryLang === "sv") return queryLang;
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "en" || stored === "sv") return stored;
  const nav = window.navigator?.language ?? "";
  return nav.toLowerCase().startsWith("sv") ? "sv" : "en";
}
