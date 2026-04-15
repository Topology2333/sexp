import { describe, expect, it } from "vitest";
import { parse_expr } from "../utlc/parse_expr";

describe("utlc parse_expr", () => {
  it("parses variables", () => {
    expect(parse_expr("x")).toEqual({ tag: "var_", name: "x" });
  });

  it("parses lambda abstraction", () => {
    expect(parse_expr("(lambda (x) x)")).toEqual({
      tag: "abs",
      param: "x",
      body: { tag: "var_", name: "x" },
    });
  });

  it("parses application", () => {
    expect(parse_expr("(f x)")).toEqual({
      tag: "app",
      func: { tag: "var_", name: "f" },
      args: { tag: "var_", name: "x" },
    });
  });

  it("parses nested application", () => {
    expect(parse_expr("((f x) y)")).toEqual({
      tag: "app",
      func: {
        tag: "app",
        func: { tag: "var_", name: "f" },
        args: { tag: "var_", name: "x" },
      },
      args: { tag: "var_", name: "y" },
    });
  });
});
