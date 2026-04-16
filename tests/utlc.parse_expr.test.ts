import { describe, expect, it } from "vitest";
import { parse_expr } from "../utlc/parse_expr";

describe("utlc parse_expr", () => {
  it("parses variable: x", () => {
    expect(parse_expr("x")).toEqual({ tag: "var_", name: "x" });
  });

  it("parses application: (f x)", () => {
    expect(parse_expr("(f x)")).toEqual({
      tag: "app",
      func: { tag: "var_", name: "f" },
      args: { tag: "var_", name: "x" },
    });
  });

  it("parses multi-argument application: (f x y)", () => {
    // (f x y) 解析为左结合：((f x) y)
    expect(parse_expr("(f x y)")).toEqual({
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
    expect(parse_expr("(lambda x x)")).toEqual({
      tag: "abs",
      param: "x",
      body: { tag: "var_", name: "x" },
    });
  });

  it("parses lambda with parentheses: (lambda (x) x)", () => {
    expect(parse_expr("(lambda (x) x)")).toEqual({
      tag: "abs",
      param: "x",
      body: { tag: "var_", name: "x" },
    });
  });

  it("parses nested application inside lambda: (lambda (x) (f x y))", () => {
    expect(parse_expr("(lambda (x) (f x y))")).toEqual({
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