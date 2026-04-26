import { useEffect, useMemo, useState } from "react";

import { CelestialSky } from "./components/CelestialSky";
import { CompanyModal } from "./components/CompanyModal";
import { CourseMomentsModal } from "./components/CourseMomentsModal";
import { Courses } from "./components/Courses";
import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import { Focus } from "./components/Focus";
import { FocusModal } from "./components/FocusModal";
import { Hero } from "./components/Hero";
import { Languages } from "./components/Languages";
import { ProgramCoursesModal } from "./components/ProgramCoursesModal";
import { ProjectModal } from "./components/ProjectModal";
import { Projects } from "./components/Projects";
import { SkillModal } from "./components/SkillModal";
import { Skills } from "./components/Skills";
import { SummaryModal } from "./components/SummaryModal";
import { Timeline } from "./components/Timeline";
import cv from "./data/cv.json";
import type {
  Company,
  Course,
  Education as EducationItem,
  FocusArea,
  Project,
  SkillDetail,
} from "./data/cv.types";
import { useGlassReflections } from "./utils/glassReflections";
import { useLang } from "./utils/i18n";
import { buildCompanyStackMap, buildSkillUsageMap } from "./utils/skills";
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
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<FocusArea | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<EducationItem | null>(
    null,
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const { t } = useLang();
  useGlassReflections();

  useEffect(() => {
    document.title = t(cv.meta.documentTitle);
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", t(cv.meta.description));
  }, [t]);

  return (
    <>
      <CelestialSky theme={theme} />
      <div className="page">
        <main className="container">
          <Hero
            cv={cv}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenTimeline={() => setTimelineOpen(true)}
            onOpenSummary={() => setSummaryOpen(true)}
          />
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
            onSkillClick={setSelectedSkill}
          />
          <Languages
            title={t(cv.sections.languages)}
            languages={cv.languages}
          />
        </main>
        <footer className="footer container">
          <span>
            © {new Date().getFullYear()} {cv.name}
          </span>
        </footer>
      </div>
      <Timeline open={timelineOpen} onClose={() => setTimelineOpen(false)} />
      <SummaryModal
        open={summaryOpen}
        name={cv.name}
        title={cv.title}
        longSummary={cv.longSummary}
        onClose={() => setSummaryOpen(false)}
      />
      <SkillModal
        skill={selectedSkill}
        usages={selectedSkill ? (skillUsages.get(selectedSkill) ?? []) : []}
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
      />
      <ProgramCoursesModal
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onSkillClick={(skill) => {
          setSelectedProgram(null);
          setSelectedSkill(skill);
        }}
      />
      <CourseMomentsModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onSkillClick={(skill) => {
          setSelectedCourse(null);
          setSelectedSkill(skill);
        }}
      />
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
    </>
  );
}
