import { describe, expect, it } from "vitest";
import { parse_expr } from "../parse_expr";

describe("utlc parse_expr", () => {
  it("parses variable: x", () => {
    const result = parse_expr("x");
    expect(result.errors).toEqual([]);
    expect(result.exprs[0]).toMatchObject({
      tag: "var_",
      name: "x",
    });
  });

  it("parses application: (f x)", () => {
    const result = parse_expr("(f x)");
    expect(result.errors).toEqual([]);
    expect(result.exprs[0]).toMatchObject({
      tag: "app",
      func: { tag: "var_", name: "f" },
      args: { tag: "var_", name: "x" },
    });
  });

  it("parses multi-argument application: (f x y)", () => {
    const result = parse_expr("(f x y)");
    expect(result.errors).toEqual([]);
    expect(result.exprs[0]).toMatchObject({
      tag: "app",
      func: {
        tag: "app",
        func: { tag: "var_", name: "f" },
        args: { tag: "var_", name: "x" },
      },
      args: { tag: "var_", name: "y" },
    });
  });

  it("parses lambda without parentheses: (lambda x x)", () => {
    const result = parse_expr("(lambda x x)");
    expect(result.errors).toEqual([]);
    expect(result.exprs[0]).toMatchObject({
      tag: "abs",
      param: "x",
      body: { tag: "var_", name: "x" },
    });
  });

  it("parses lambda with parentheses: (lambda (x) x)", () => {
    const result = parse_expr("(lambda (x) x)");
    expect(result.errors).toEqual([]);
    expect(result.exprs[0]).toMatchObject({
      tag: "abs",
      param: "x",
      body: { tag: "var_", name: "x" },
    });
  });

  it("parses nested application inside lambda: (lambda (x) (f x y))", () => {
    const result = parse_expr("(lambda (x) (f x y))");
    expect(result.errors).toEqual([]);
    expect(result.exprs[0]).toMatchObject({
      tag: "abs",
      param: "x",
      body: {
        tag: "app",
        func: {
          tag: "app",
          func: { tag: "var_", name: "f" },
          args: { tag: "var_", name: "x" },
        },
        args: { tag: "var_", name: "y" },
      },
    });
  });
});