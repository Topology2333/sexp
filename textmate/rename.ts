import { syntax, token, parser } from "./sexp";
import type { position, range } from "./sexp";
import { infer_source } from "./check";
import type { context } from "./check";
import type { stmt, expr } from "./check";

import * as vscode from "vscode";
import type { RenameProvider as Provider } from "vscode";
export { make };

type bool = boolean;

const is_selected = (tok: token, pos: vscode.Position): bool => {
  const is_same_line = tok.line === pos.line;
  const is_pos_in_token =
    tok.character <= pos.character &&
    pos.character <= tok.character + tok.length;
  return is_same_line && is_pos_in_token;
};

const renaming_token = (
  sexp: syntax[],
  pos: vscode.Position,
): token | undefined => {
  const dfs = (syn: syntax): token | undefined => {
    switch (syn.tag) {
      case syntax.tag.atom:
      case syntax.tag.lone: {
        if (is_selected(syn.leaf, pos)) {
          return syn.leaf;
        }
        return undefined;
      }
      case syntax.tag.group:
      case syntax.tag.mismatch: {
        return dfs_many(syn.children);
      }
    }
  };
  const dfs_many = (syns: syntax[]): token | undefined => {
    for (let tl of syns) {
      let val = dfs(tl);
      if (val !== undefined) {
        return val;
      }
    }
    return undefined;
  };
  return dfs_many(sexp);
};

const renaming_span = (
  sexp: syntax[],
  text: string,
  pos: vscode.Position,
): string => {
  const tok = renaming_token(sexp, pos);
  return tok ? text.slice(tok.start, tok.end) : "";
};

const collect_ranges = (stmts: stmt[], old_text: string): range[] => {
  let dst: range[] = [];

  let dfs_stmt = (stmt: stmt): void => {
    // prettier-ignore
    switch (stmt.tag) {
      case "binding": {
        if (old_text === stmt.binder.text) { dst.push(stmt.binder.range); }
        dfs_expr(stmt.body)
        break;
      }
      case "grammar": {
        if (old_text === stmt.name.text) { dst.push(stmt.name.range); }
        break;
      }
      case "hole": break;
    }
  };
  let dfs_expr = (exp: expr): void => {
    // prettier-ignore
    switch (exp.tag) {
      case "variable": { if (old_text === exp.name) { dst.push(exp.range) } break; }
      case "union": case "choice": case "concat": { for (const child of exp.children) { dfs_expr(child); } break; }
      case "match": case "repeat": case "negative": { dfs_expr(exp.rex); break; }
      case "surround": { dfs_expr(exp.begin); dfs_expr(exp.end); dfs_expr(exp.begin_pats); dfs_expr(exp.end_pats); dfs_expr(exp.patterns); }
      case "lstr": case "code_point": case "hole": break;
    }
  };
  for (const stmt of stmts) {
    dfs_stmt(stmt);
  }
  return dst;
};

const make = (out : vscode.OutputChannel) : Provider  => {
  return {

  provideRenameEdits: (doc, pos, new_name, _) => {
    const text = doc.getText();

    const prs = parser.make(text);
    const sexp = parser.parse(prs);
    const old_name = renaming_span(sexp, text, pos);
    const ctx: context = {
      toplevel: new Map(),
      report: [],
      text,
    };
    const ast = infer_source(ctx, sexp);
    let ranges = collect_ranges(ast, old_name);

    let edit = new vscode.WorkspaceEdit();
    for (const r of ranges) {
      const range = new vscode.Range(
        new vscode.Position(r.start.line, r.start.character),
        new vscode.Position(r.end.line, r.end.character),
      );
      edit.replace(doc.uri, range, new_name);
    }
    return edit;
  },

  }
}

