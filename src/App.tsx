import { useEffect, useMemo, useState } from "react";

import { Courses } from "./components/Courses";
import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import { Focus } from "./components/Focus";
import { FocusModal } from "./components/FocusModal";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { SkillModal } from "./components/SkillModal";
import { Skills } from "./components/Skills";
import { Timeline } from "./components/Timeline";
import cv from "./data/cv.json";
import type { Company, FocusArea, SkillDetail } from "./data/cv.types";
import { useLang } from "./utils/i18n";
import { buildSkillUsageMap } from "./utils/skills";
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
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<FocusArea | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const { t } = useLang();

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
    <div className="page">
      <main className="container">
        <Hero
          cv={cv}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenTimeline={() => setTimelineOpen(true)}
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
        />
        <Experience
          title={t(cv.sections.experience)}
          experience={cv.experience}
          companies={companies}
          onSkillClick={setSelectedSkill}
        />
        <Education
          title={t(cv.sections.education)}
          education={cv.education}
          onSkillClick={setSelectedSkill}
        />
        <Courses
          title={t(cv.sections.courses)}
          courses={cv.courses}
          onSkillClick={setSelectedSkill}
        />
        <Skills
          title={t(cv.sections.skills)}
          skills={cv.skills}
          usages={skillUsages}
          onSkillClick={setSelectedSkill}
        />
      </main>
      <footer className="footer container">
        <span>
          © {new Date().getFullYear()} {cv.name}
        </span>
      </footer>
      <Timeline open={timelineOpen} onClose={() => setTimelineOpen(false)} />
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
    </div>
  );
}
