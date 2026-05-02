import { useEffect, useMemo, useState } from "react";

import { CompanyModal } from "./components/CompanyModal";
import { CourseModulesModal } from "./components/CourseModulesModal";
import { Courses } from "./components/Courses";
import { EctsModal } from "./components/EctsModal";
import type { EctsContext } from "./components/EctsPill";
import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import type { ExperienceModalData } from "./components/ExperienceModal";
import { ExperienceModal } from "./components/ExperienceModal";
import { FloatingControls } from "./components/FloatingControls";
import { Focus } from "./components/Focus";
import { FocusModal } from "./components/FocusModal";
import { Hero } from "./components/Hero";
import { LanguageModal } from "./components/LanguageModal";
import { Languages } from "./components/Languages";
import { PrintView } from "./components/PrintView";
import { ProgramCoursesModal } from "./components/ProgramCoursesModal";
import { ProjectModal } from "./components/ProjectModal";
import { Projects } from "./components/Projects";
import { SearchModal } from "./components/SearchModal";
import { SkillModal } from "./components/SkillModal";
import { Skills } from "./components/Skills";
import { SummaryModal } from "./components/SummaryModal";
import { Timeline } from "./components/Timeline";
import cv from "./data/cv";
import type {
  Company,
  Course,
  Education as EducationItem,
  FocusArea,
  Project,
  SkillDetail,
  SpokenLanguage,
} from "./data/cv.types";
import {
  assignmentOpenerKey,
  experienceOpenerKey,
} from "./data/opener-keys.mjs";
import type { SearchKind } from "./data/search-index.types";
import { useGlassReflections } from "./utils/glassReflections";
import { useLang } from "./utils/i18n";
import { useRoute } from "./utils/route";
import { findSkillGroupKey } from "./utils/skillGroup";
import {
  buildCompanyStackMap,
  buildSkillUsageMap,
  buildUnusedStackOnlySet,
  buildUnusedStackUsageMap,
} from "./utils/skills";
import { useTheme } from "./utils/theme";

export function App() {
  const companies = useMemo(
    () => new Map<string, Company>(cv.companies.map((c) => [c.id, c])),
    [],
  );
  const skillUsages = useMemo(
    () => buildSkillUsageMap(cv, companies),
    [companies],
  );
  const companyStacks = useMemo(() => buildCompanyStackMap(cv), []);
  const unusedStackOnly = useMemo(() => buildUnusedStackOnlySet(cv), []);
  const unusedStackLocations = useMemo(
    () => buildUnusedStackUsageMap(cv, companies),
    [companies],
  );
  const projectsByName = useMemo(
    () => new Map<string, Project>(cv.projects.map((p) => [p.name, p])),
    [],
  );
  const focusByAreaEn = useMemo(
    () => new Map<string, FocusArea>(cv.focus.map((f) => [f.area.en, f])),
    [],
  );
  const educationByFieldEn = useMemo(
    () =>
      new Map<string, EducationItem>(cv.education.map((e) => [e.field.en, e])),
    [],
  );
  const courseByNameEn = useMemo(
    () => new Map<string, Course>(cv.courses.map((c) => [c.name.en, c])),
    [],
  );
  const experienceByKey = useMemo(() => {
    const map = new Map<string, ExperienceModalData>();
    for (const exp of cv.experience) {
      const company = companies.get(exp.companyId);
      if (!company) continue;
      map.set(experienceOpenerKey(exp), {
        kind: "experience",
        item: exp,
        company,
      });
      for (const asg of exp.assignments ?? []) {
        const client = companies.get(asg.clientId);
        if (!client) continue;
        map.set(assignmentOpenerKey(exp, asg), {
          kind: "assignment",
          item: asg,
          client,
          via: company,
        });
      }
    }
    return map;
  }, [companies]);
  const route = useRoute();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<FocusArea | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<EducationItem | null>(
    null,
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceModalData | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SpokenLanguage | null>(null);
  const [ectsContext, setEctsContext] = useState<EctsContext | null>(null);
  const { theme, toggle: toggleTheme, setTheme } = useTheme();
  const { t, ui } = useLang();
  useGlassReflections();

  // Keep the search modal mounted underneath when a result is opened so
  // closing the destination modal returns instantly to the search results
  // (no blink of the underlying page between modals).
  const handleSearchSelect = (kind: SearchKind, openerKey: string) => {
    switch (kind) {
      case "summary":
        setSummaryOpen(true);
        return;
      case "focus": {
        const focus = focusByAreaEn.get(openerKey);
        if (focus) setSelectedFocus(focus);
        return;
      }
      case "project": {
        const project = projectsByName.get(openerKey);
        if (project) setSelectedProject(project);
        return;
      }
      case "company": {
        const company = companies.get(openerKey);
        if (company) setSelectedCompany(company);
        return;
      }
      case "experience":
      case "assignment": {
        const experience = experienceByKey.get(openerKey);
        if (experience) setSelectedExperience(experience);
        return;
      }
      case "education": {
        const program = educationByFieldEn.get(openerKey);
        if (program) setSelectedProgram(program);
        return;
      }
      case "course": {
        const course = courseByNameEn.get(openerKey);
        if (course) setSelectedCourse(course);
        return;
      }
      case "skill": {
        setSelectedSkill(openerKey);
        return;
      }
    }
  };

  const anyDestinationModalOpen =
    summaryOpen ||
    selectedSkill !== null ||
    selectedFocus !== null ||
    selectedProgram !== null ||
    selectedCourse !== null ||
    selectedCompany !== null ||
    selectedProject !== null ||
    selectedExperience !== null ||
    selectedLanguage !== null;

  useEffect(() => {
    const base = t(cv.meta.documentTitle);
    document.title =
      route === "timeline" ? `${ui.timeline.title} — ${base}` : base;
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", t(cv.meta.description));
  }, [t, route, ui.timeline.title]);

  useEffect(() => {
    if (route === "timeline") return;
    function onKey(e: KeyboardEvent) {
      const cmdK = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      const slash =
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableTarget(e.target);
      if (cmdK || slash) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [route]);

  if (route === "timeline") {
    return <Timeline />;
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        {ui.skipToContent}
      </a>
      <div className="page">
        <span className="page-glow" aria-hidden="true" />
        <Hero
          cv={cv}
          theme={theme}
          setTheme={setTheme}
          onOpenSummary={() => setSummaryOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main id="main-content" className="container" tabIndex={-1}>
          <Focus
            title={t(cv.sections.focus)}
            focus={cv.focus}
            onFocusClick={setSelectedFocus}
          />
          <Projects
            title={t(cv.sections.projects)}
            projects={cv.projects}
            onSkillClick={setSelectedSkill}
            onProjectClick={setSelectedProject}
          />
          <Experience
            title={t(cv.sections.experience)}
            experience={cv.experience}
            companies={companies}
            onSkillClick={setSelectedSkill}
            onCompanyClick={setSelectedCompany}
            onCardClick={setSelectedExperience}
          />
          <Education
            title={t(cv.sections.education)}
            education={cv.education}
            onSkillClick={setSelectedSkill}
            onProgramClick={setSelectedProgram}
          />
          <Courses
            title={t(cv.sections.courses)}
            courses={cv.courses}
            onSkillClick={setSelectedSkill}
            onCourseClick={setSelectedCourse}
          />
          <Skills
            title={t(cv.sections.skills)}
            skills={cv.skills}
            usages={skillUsages}
            hiddenSkills={unusedStackOnly}
            onSkillClick={setSelectedSkill}
          />
          <Languages
            title={t(cv.sections.languages)}
            languages={cv.languages}
            onLanguageClick={setSelectedLanguage}
          />
          <PrintView />
        </main>
        <footer className="footer container">
          <span>
            © {new Date().getFullYear()} {cv.name}
          </span>
        </footer>
      </div>
      <FloatingControls
        timelineLabel={ui.hero.timeline}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <SearchModal
        open={searchOpen}
        inert={anyDestinationModalOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
      <SummaryModal
        open={summaryOpen}
        name={cv.name}
        title={cv.title}
        longSummary={cv.longSummary}
        onClose={() => setSummaryOpen(false)}
      />
      <SkillModal
        skill={selectedSkill}
        groupKey={
          selectedSkill
            ? findSkillGroupKey(cv.skills, selectedSkill)
            : undefined
        }
        usages={selectedSkill ? (skillUsages.get(selectedSkill) ?? []) : []}
        unusedAt={
          selectedSkill ? (unusedStackLocations.get(selectedSkill) ?? []) : []
        }
        detail={
          selectedSkill
            ? (cv.skillDetails as Record<string, SkillDetail>)[selectedSkill]
            : undefined
        }
        onClose={() => setSelectedSkill(null)}
      />
      <FocusModal
        focus={selectedFocus}
        onClose={() => setSelectedFocus(null)}
        onSkillClick={(skill) => {
          setSelectedFocus(null);
          setSelectedSkill(skill);
        }}
      />
      <ProgramCoursesModal
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onSkillClick={(skill) => {
          setSelectedProgram(null);
          setSelectedSkill(skill);
        }}
        onEctsClick={setEctsContext}
      />
      <CourseModulesModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onSkillClick={(skill) => {
          setSelectedCourse(null);
          setSelectedSkill(skill);
        }}
        onEctsClick={setEctsContext}
      />
      <EctsModal context={ectsContext} onClose={() => setEctsContext(null)} />
      <CompanyModal
        company={selectedCompany}
        stack={
          selectedCompany ? (companyStacks.get(selectedCompany.id) ?? []) : []
        }
        onClose={() => setSelectedCompany(null)}
        onSkillClick={(skill) => {
          setSelectedCompany(null);
          setSelectedSkill(skill);
        }}
      />
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onSkillClick={(skill) => {
          setSelectedProject(null);
          setSelectedSkill(skill);
        }}
      />
      <ExperienceModal
        data={selectedExperience}
        onClose={() => setSelectedExperience(null)}
        onSkillClick={(skill) => {
          setSelectedExperience(null);
          setSelectedSkill(skill);
        }}
        onCompanyClick={(company) => {
          setSelectedExperience(null);
          setSelectedCompany(company);
        }}
      />
      <LanguageModal
        language={selectedLanguage}
        onClose={() => setSelectedLanguage(null)}
      />
    </>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
