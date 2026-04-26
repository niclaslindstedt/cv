import printDataRaw from "../data/print.json";
import type {
  PrintAssignment,
  PrintCourse,
  PrintData,
  PrintEducation,
  PrintExperience,
  PrintLanguage,
  PrintProject,
  PrintRoleHistoryEntry,
  PrintSkillGroup,
} from "../data/print.types";
import { useLang } from "../utils/i18n";

const printData = printDataRaw as PrintData;

export function PrintView() {
  return (
    <section className="print-view" aria-hidden="true">
      <PrintHero />
      <ExperienceSection />
      <ProjectsSection />
      <EducationSection />
      <CoursesSection />
      <SkillsSection />
      <LanguagesSection />
    </section>
  );
}

function PrintHero() {
  const { t } = useLang();
  return (
    <header className="print-hero">
      <h1 className="print-name">{printData.name}</h1>
      <p className="print-title">{t(printData.title)}</p>
      <p className="print-summary">{t(printData.longSummary)}</p>
    </header>
  );
}

function ExperienceSection() {
  const { t } = useLang();
  return (
    <section className="print-section">
      <h2 className="print-section-title">
        {t(printData.sections.experience)}
      </h2>
      <ul className="print-experience">
        {printData.experience.map((item, i) => (
          <ExperienceEntry key={`${item.company}-${i}`} item={item} />
        ))}
      </ul>
    </section>
  );
}

function ExperienceEntry({ item }: { item: PrintExperience }) {
  const { t, ui } = useLang();
  const hasAssignments = item.assignments.length > 0;
  const classes = ["print-job"];
  if (hasAssignments) classes.push("print-job--with-assignments");
  return (
    <li className={classes.join(" ")}>
      <div className="print-job-header">
        <h3 className="print-job-title">
          <span className="print-job-role">{t(item.role)}</span>
          {" · "}
          <span className="print-job-company">{item.company}</span>
        </h3>
        <p className="print-job-meta">
          {t(item.range)}
          {item.engagement && (
            <>
              {" · "}
              <span className="print-job-engagement">{t(item.engagement)}</span>
            </>
          )}
        </p>
        {item.roleHistory.length > 0 && (
          <RoleHistory roles={item.roleHistory} />
        )}
        <p className="print-job-tagline">{t(item.tagline)}</p>
        {item.tags.length > 0 && (
          <p className="print-tags">{item.tags.join(", ")}</p>
        )}
        {item.notes && <p className="print-notes">{t(item.notes)}</p>}
      </div>
      {hasAssignments && (
        <div className="print-assignments-block">
          <h4 className="print-assignments-heading">
            {ui.experience.assignmentsHeading}
          </h4>
          <ul className="print-assignments">
            {item.assignments.map((a, i) => (
              <AssignmentEntry key={`${a.client}-${i}`} item={a} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function AssignmentEntry({ item }: { item: PrintAssignment }) {
  const { t } = useLang();
  return (
    <li className="print-assignment">
      <h4 className="print-job-title">
        <span className="print-job-role">{t(item.role)}</span>
        {" · "}
        <span className="print-job-company">{item.client}</span>
      </h4>
      <p className="print-job-meta">{t(item.range)}</p>
      {item.roleHistory.length > 0 && <RoleHistory roles={item.roleHistory} />}
      <p className="print-job-tagline">{t(item.tagline)}</p>
      {item.tags.length > 0 && (
        <p className="print-tags">{item.tags.join(", ")}</p>
      )}
      {item.notes && <p className="print-notes">{t(item.notes)}</p>}
    </li>
  );
}

function RoleHistory({ roles }: { roles: PrintRoleHistoryEntry[] }) {
  const { t } = useLang();
  return (
    <ul className="print-role-history">
      {roles.map((r, i) => (
        <li key={`${r.title.en}-${i}`}>
          <span className="print-job-role">{t(r.title)}</span>
          {" · "}
          <span className="print-role-history-range">{t(r.range)}</span>
        </li>
      ))}
    </ul>
  );
}

function ProjectsSection() {
  const { t } = useLang();
  return (
    <section className="print-section">
      <h2 className="print-section-title">{t(printData.sections.projects)}</h2>
      <ul className="print-projects">
        {printData.projects.map((p) => (
          <ProjectEntry key={p.name} item={p} />
        ))}
      </ul>
    </section>
  );
}

function ProjectEntry({ item }: { item: PrintProject }) {
  const { t } = useLang();
  return (
    <li className="print-project">
      <strong className="print-project-name">{item.name}</strong>
      {": "}
      <span className="print-project-tagline">{t(item.tagline)}</span>
    </li>
  );
}

function EducationSection() {
  const { t } = useLang();
  return (
    <section className="print-section">
      <h2 className="print-section-title">{t(printData.sections.education)}</h2>
      <ul className="print-education">
        {printData.education.map((e, i) => (
          <EducationEntry key={`${e.institution.en}-${i}`} item={e} />
        ))}
      </ul>
    </section>
  );
}

function EducationEntry({ item }: { item: PrintEducation }) {
  const { t } = useLang();
  return (
    <li className="print-edu">
      <div className="print-edu-head">
        <h3 className="print-edu-title">{t(item.field)}</h3>
        <span className="print-edu-range">{t(item.range)}</span>
      </div>
      <p className="print-edu-meta">
        {t(item.institution)} {" · "} {t(item.level)} {" · "} {item.credits}
      </p>
    </li>
  );
}

function CoursesSection() {
  const { t } = useLang();
  if (printData.courses.length === 0) return null;
  return (
    <section className="print-section">
      <h2 className="print-section-title">{t(printData.sections.courses)}</h2>
      <ul className="print-courses">
        {printData.courses.map((c, i) => (
          <CourseEntry key={`${c.code}-${i}`} item={c} />
        ))}
      </ul>
    </section>
  );
}

function CourseEntry({ item }: { item: PrintCourse }) {
  const { t } = useLang();
  const detailParts = [item.code, item.credits, ...item.details.map(t)];
  return (
    <li className="print-edu">
      <div className="print-edu-head">
        <h3 className="print-edu-title">{t(item.name)}</h3>
        <span className="print-edu-range">{t(item.range)}</span>
      </div>
      <p className="print-edu-meta">
        {t(item.institution)} {" · "} {detailParts.join(" · ")}
      </p>
    </li>
  );
}

function SkillsSection() {
  const { t } = useLang();
  return (
    <section className="print-section">
      <h2 className="print-section-title">{t(printData.sections.skills)}</h2>
      <ul className="print-skills">
        {printData.skills.map((g) => (
          <SkillEntry key={g.label.en} item={g} />
        ))}
      </ul>
    </section>
  );
}

function SkillEntry({ item }: { item: PrintSkillGroup }) {
  const { t } = useLang();
  return (
    <li className="print-skill-group">
      <strong className="print-skill-label">{t(item.label)}</strong>
      {": "}
      <span className="print-skill-items">{item.items.join(", ")}</span>
    </li>
  );
}

function LanguagesSection() {
  const { t } = useLang();
  return (
    <section className="print-section">
      <h2 className="print-section-title">{t(printData.sections.languages)}</h2>
      <ul className="print-languages">
        {printData.languages.map((l) => (
          <LanguageEntry key={l.name.en} item={l} />
        ))}
      </ul>
    </section>
  );
}

function LanguageEntry({ item }: { item: PrintLanguage }) {
  const { t } = useLang();
  return (
    <li className="print-language">
      <strong>{t(item.name)}</strong>
      {" ("}
      {t(item.level)}
      {")"}
    </li>
  );
}
