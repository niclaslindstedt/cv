import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import { Focus } from "./components/Focus";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { Skills } from "./components/Skills";
import { cv } from "./data/cv";

export function App() {
  return (
    <div className="page">
      <main className="container">
        <Hero cv={cv} />
        <Focus focus={cv.focus} />
        <Projects projects={cv.projects} />
        <Experience experience={cv.experience} />
        <Education education={cv.education} />
        <Skills skills={cv.skills} />
      </main>
      <footer className="footer container">
        <span>© {new Date().getFullYear()} {cv.name}</span>
      </footer>
    </div>
  );
}
