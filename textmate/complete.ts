import { syntax, token, parser } from "./sexp";
import type { position, range } from "./sexp";
import { infer_source } from "./check";
import type { context } from "./check";
import * as vscode from "vscode";
import type { CompletionItemProvider as Provider } from "vscode";
import { CompletionItemKind as kind, CompletionItem as Item } from "vscode";
export { make };

type bool = boolean;

const is_typing = (tok: token, pos: vscode.Position): bool => {
  return tok.line === pos.line && tok.character + tok.length === pos.character;
};

let typing_token = (
  sexp: syntax[],
  pos: vscode.Position,
): token | undefined => {
  let dfs = (syn: syntax): token | undefined => {
    switch (syn.tag) {
      case syntax.tag.atom:
      case syntax.tag.lone: {
        if (is_typing(syn.leaf, pos)) {
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
  let dfs_many = (syns: syntax[]): token | undefined => {
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

let typing_span = (
  sexp: syntax[],
  text: string,
  pos: vscode.Position,
): string => {
  let tok = typing_token(sexp, pos);
  return tok ? text.slice(tok.start, tok.end) : "";
};

const make = (out: vscode.OutputChannel): Provider => {
  return {
    provideCompletionItems: (doc, pos, _) => {
      const text = doc.getText();
      let prs = parser.make(text);
      let sexp = parser.parse(prs);
      let ctx: context = { toplevel: new Map(), text, report: [] };
      let ast = infer_source(ctx, sexp);
      let ts = typing_span(sexp, text, pos);
      let rslt = [
        ...ctx.toplevel
          .keys()
          .filter(x => x != ts)
          .map(x => new Item(x, kind.Variable)),
      ];
      return rslt;
    },
  };
};
