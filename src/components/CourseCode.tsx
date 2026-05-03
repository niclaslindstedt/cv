import { useLang } from "../utils/i18n";

type Props = {
  code: string;
  university: string;
  variant?: "course" | "module";
};

export function CourseCode({ code, university, variant = "course" }: Props) {
  const { ui } = useLang();
  const query = `+"${university}" +"${code}"`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const className =
    variant === "module" ? "program-module-code" : "program-course-code";
  return (
    <a
      className={className}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ui.courses.searchCodeAria(code, university)}
    >
      {code}
    </a>
  );
}
