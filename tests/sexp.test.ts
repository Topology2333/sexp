import { describe, expect, it } from "vitest";
import { parser, syntax } from "../sexp";

const parseSkeleton = (text: string): string[] => {
  const p = parser.make(text);
  const tree = parser.parse(p);
  return tree.map(node => syntax.skeleton.debug(node));
};

describe("sexp parser", () => {
  it("parses a simple list", () => {
    expect(parseSkeleton("(a)")).toEqual([
      "(parenthesis.left atom.identifier parenthesis.right)",
    ]);
  });

  it("parses nested lists", () => {
    expect(parseSkeleton("((a))")).toEqual([
      "(parenthesis.left (parenthesis.left atom.identifier parenthesis.right) parenthesis.right)",
    ]);
  });

  it("marks mismatched delimiters", () => {
    expect(parseSkeleton("(]")).toEqual([
      "(parenthesis.left square_bracket.right)",
    ]);
  });

  it("keeps lone closing tokens", () => {
    expect(parseSkeleton(")")).toEqual(["parenthesis.right"]);
  });

  it("keeps unclosed opening tokens", () => {
    expect(parseSkeleton("(")).toEqual(["parenthesis.left"]);
  });

  it("treats quotes as groups", () => {
    expect(parseSkeleton("'a'")).toEqual([
      "(quote.single atom.identifier quote.single)",
    ]);
  });

  it("tokenizes spaces as atoms", () => {
    expect(parseSkeleton("a b")).toEqual([
      "atom.identifier",
      "atom.space",
      "atom.identifier",
    ]);
  });
});
