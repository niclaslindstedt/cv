import { useDeferredValue, useEffect, useRef, useState } from "react";

import type { SearchKind, SearchRecord } from "../data/search-index.types";
import { useLang } from "../utils/i18n";
import type { SearchMatch } from "../utils/search";
import { useSearch } from "../utils/search";
import { useModalFocus } from "../utils/useModalFocus";
import { useSwipeClose } from "../utils/useSwipeClose";

type Props = {
  open: boolean;
  inert?: boolean;
  onClose: () => void;
  onSelect: (kind: SearchKind, openerKey: string) => void;
};

export function SearchModal({ open, inert = false, onClose, onSelect }: Props) {
  const { lang, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const active = open && !inert;
  const { results, ready } = useSearch(deferredQuery, open);

  useSwipeClose(modalRef, active, onClose);
  useModalFocus(modalRef, active);

  // Select any persisted query on reopen so typing replaces it immediately.
  // Keyed on `open` (not `active`) so returning from a destination modal
  // restores focus without re-selecting the text the user already typed.
  useEffect(() => {
    if (!open) return;
    const input = inputRef.current;
    if (input && input.value.length > 0) input.select();
  }, [open]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const trimmed = deferredQuery.trim();
  const hasQuery = trimmed.length > 0;
  const showEmptyHint = !hasQuery;
  const showNoResults = hasQuery && ready && results.total === 0;

  return (
    <div
      className={
        inert
          ? "search-modal-overlay search-modal-overlay--inert"
          : "search-modal-overlay"
      }
      role="dialog"
      aria-modal="true"
      aria-label={ui.search.dialogAria}
      aria-hidden={inert ? "true" : undefined}
      onClick={inert ? undefined : onClose}
    >
      <div
        ref={modalRef}
        className="search-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-modal-scroll">
          <header className="search-modal-head">
            <svg
              className="search-modal-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              className="search-modal-input"
              placeholder={ui.search.placeholder}
              aria-label={ui.search.inputAria}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="search-modal-close"
              onClick={onClose}
              aria-label={ui.search.close}
            >
              ✕
            </button>
          </header>
          <div
            className="search-modal-body"
            role="region"
            aria-live="polite"
            aria-label={
              hasQuery && ready
                ? ui.search.resultCountAria(results.total)
                : undefined
            }
          >
            {showEmptyHint && (
              <p className="search-empty-hint">{ui.search.emptyHint}</p>
            )}
            {showNoResults && (
              <p className="search-empty-hint">
                {ui.search.noResults(trimmed)}
              </p>
            )}
            {hasQuery && results.hits.length > 0 && (
              <ul className="search-results">
                {results.hits.map((hit) => (
                  <SearchResultItem
                    key={`${hit.record.kind}:${hit.record.openerKey}:${hit.record.lang}`}
                    record={hit.record}
                    match={hit.matches[0]}
                    lang={lang}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResultItem({
  record,
  match,
  lang,
  onSelect,
}: {
  record: SearchRecord;
  match: SearchMatch | undefined;
  lang: "en" | "sv";
  onSelect: (kind: SearchKind, openerKey: string) => void;
}) {
  const { ui } = useLang();
  const title = record.localizedTitle?.[lang] ?? record.title;
  const secondary = record.localizedSecondary?.[lang] ?? record.secondary;
  const kindLabel = ui.search.kindLabels[record.kind];
  const explanation = match ? ui.search.matchExplanation(match) : null;
  return (
    <li className="search-result">
      <button
        type="button"
        className="search-result-button"
        onClick={() => onSelect(record.kind, record.openerKey)}
      >
        <span className="search-result-row">
          <span className="search-result-kind">{kindLabel}</span>
          <span className="search-result-title">{title}</span>
        </span>
        {secondary && (
          <span className="search-result-secondary">{secondary}</span>
        )}
        {explanation && (
          <span className="search-result-match" aria-label={explanation.aria}>
            {explanation.text}
          </span>
        )}
      </button>
    </li>
  );
}
