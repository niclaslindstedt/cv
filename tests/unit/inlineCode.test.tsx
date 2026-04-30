import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { renderInlineCode, stripInlineCode } from "../../src/utils/inlineCode";

// Tests run under vitest's node environment, so flatten React output rather
// than rendering the tree. Strings stay strings; <code> elements expose their
// children via props; fragments expose an array of children.
function flatten(
  node: ReactNode,
): Array<{ tag: "text" | "code"; value: string }> {
  if (node == null || node === false) return [];
  if (typeof node === "string") return [{ tag: "text", value: node }];
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (el.type === "code") {
      const child = el.props.children;
      const text = typeof child === "string" ? child : "";
      return [{ tag: "code", value: text }];
    }
    return flatten(el.props.children ?? null);
  }
  return [];
}

describe("renderInlineCode", () => {
  it("returns the original string when no backticks are present", () => {
    expect(renderInlineCode("plain text")).toBe("plain text");
  });

  it("wraps a single backtick span in <code>", () => {
    expect(flatten(renderInlineCode("call `/spec` to start"))).toEqual([
      { tag: "text", value: "call " },
      { tag: "code", value: "/spec" },
      { tag: "text", value: " to start" },
    ]);
  });

  it("supports multiple spans in the same string", () => {
    expect(flatten(renderInlineCode("`/spec` writes a `spec.md`"))).toEqual([
      { tag: "code", value: "/spec" },
      { tag: "text", value: " writes a " },
      { tag: "code", value: "spec.md" },
    ]);
  });

  it("treats a doubled backtick as a literal", () => {
    expect(flatten(renderInlineCode("a `` b"))).toEqual([
      { tag: "text", value: "a ` b" },
    ]);
  });

  it("renders an unmatched trailing backtick verbatim", () => {
    expect(flatten(renderInlineCode("oops `unclosed"))).toEqual([
      { tag: "text", value: "oops `unclosed" },
    ]);
  });
});

describe("stripInlineCode", () => {
  it("removes backtick markers around code spans", () => {
    expect(stripInlineCode("call `/spec` to start")).toBe(
      "call /spec to start",
    );
  });

  it("decodes doubled backticks to a single literal", () => {
    expect(stripInlineCode("a `` b")).toBe("a ` b");
  });

  it("preserves unmatched trailing backticks", () => {
    expect(stripInlineCode("oops `unclosed")).toBe("oops `unclosed");
  });

  it("is a no-op when no backticks are present", () => {
    expect(stripInlineCode("plain text")).toBe("plain text");
  });
});
