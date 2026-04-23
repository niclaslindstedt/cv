import { useMemo, useState } from "react";

import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import { Focus } from "./components/Focus";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { SkillModal } from "./components/SkillModal";
import { Skills } from "./components/Skills";
import { Timeline } from "./components/Timeline";
import cv from "./data/cv.json";
import { buildSkillUsageMap } from "./utils/skills";
import { useTheme } from "./utils/theme";

export function App() {
  const skillUsages = useMemo(() => buildSkillUsageMap(cv), []);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  return (
    <div className="page">
      <main className="container">
        <Hero
          cv={cv}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenTimeline={() => setTimelineOpen(true)}
        />
        <Focus focus={cv.focus} />
        <Projects projects={cv.projects} onSkillClick={setSelectedSkill} />
        <Experience
          experience={cv.experience}
          onSkillClick={setSelectedSkill}
        />
        <Education education={cv.education} onSkillClick={setSelectedSkill} />
        <Skills
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
      <Timeline
        cv={cv}
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
      />
      <SkillModal
        skill={selectedSkill}
        usages={selectedSkill ? (skillUsages.get(selectedSkill) ?? []) : []}
        onClose={() => setSelectedSkill(null)}
      />
    </div>
  );
}
