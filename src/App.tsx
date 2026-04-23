import { useState } from "react";

import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import { Focus } from "./components/Focus";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { Skills } from "./components/Skills";
import { Timeline } from "./components/Timeline";
import cv from "./data/cv.json";
import { buildSkillUsageMap } from "./utils/skills";

export function App() {
  const skillUsages = buildSkillUsageMap(cv);
  const [timelineOpen, setTimelineOpen] = useState(false);
  return (
    <div className="page">
      <main className="container">
        <Hero cv={cv} onOpenTimeline={() => setTimelineOpen(true)} />
        <Focus focus={cv.focus} />
        <Projects projects={cv.projects} />
        <Experience experience={cv.experience} />
        <Education education={cv.education} />
        <Skills skills={cv.skills} usages={skillUsages} />
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
    </div>
  );
}
