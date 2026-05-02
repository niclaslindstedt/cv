import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  categoryStyle,
  type SectionTitleCategory,
} from "../utils/categoryStyle";
import { useLang } from "../utils/i18n";
import { CategoryGlyph } from "./CategoryGlyph";

type Props = {
  id: string;
  title: string;
  category?: SectionTitleCategory;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
};

const STORAGE_PREFIX = "section-collapsed:";

function readInitialCollapsed(id: string, defaultCollapsed: boolean): boolean {
  if (typeof window === "undefined") return defaultCollapsed;
  const stored = window.localStorage.getItem(STORAGE_PREFIX + id);
  if (stored === "1") return true;
  if (stored === "0") return false;
  return defaultCollapsed;
}

export function Section({
  id,
  title,
  category,
  collapsible = true,
  defaultCollapsed = false,
  children,
}: Props) {
  const { ui } = useLang();
  const [collapsed, setCollapsed] = useState(() =>
    collapsible ? readInitialCollapsed(id, defaultCollapsed) : false,
  );

  useEffect(() => {
    if (!collapsible || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_PREFIX + id, collapsed ? "1" : "0");
  }, [collapsible, id, collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const titleStyle = category ? categoryStyle(category) : undefined;
  const glyph = category ? (
    <span className="section-title-glyph" style={titleStyle} aria-hidden="true">
      <CategoryGlyph category={category} size={18} />
    </span>
  ) : null;

  if (!collapsible) {
    return (
      <section id={id} className="section">
        <h2 className="section-title">
          {glyph}
          {title}
        </h2>
        {children}
      </section>
    );
  }

  const contentId = `${id}-content`;
  const className = `section section-collapsible${collapsed ? " is-collapsed" : ""}`;
  return (
    <section id={id} className={className}>
      <h2 className="section-title">
        <button
          type="button"
          className="section-toggle"
          aria-expanded={!collapsed}
          aria-controls={contentId}
          aria-label={
            collapsed ? ui.section.expand(title) : ui.section.collapse(title)
          }
          onClick={toggle}
        >
          {glyph}
          <span className="section-toggle-label">{title}</span>
          <svg
            className="section-toggle-chevron"
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </h2>
      <div id={contentId} className="section-content" hidden={collapsed}>
        {children}
      </div>
    </section>
  );
}
