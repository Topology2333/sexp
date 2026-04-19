import * as fs from "node:fs";
import * as cp from "node:child_process";
import * as proc from "node:process";
import * as emit from "./emit";
import * as check from "./check";
import { lower } from "./lower";
import { parser } from "./sexp";
import { infer_source } from "./check";

import * as vscode from "vscode";
import * as path from "node:path";
import type { CodeActionProvider as Provider } from "vscode";
import { CodeAction as action, CodeActionKind as kind } from "vscode";
export { make };

let code_emission = (doc: vscode.TextDocument): action => {
  let text = doc.getText();
  let prs = parser.make(text);
  let sexp = parser.parse(prs);
  const ctx = { report: [], text, toplevel: new Map() };
  let ast = infer_source(ctx, sexp);
  let lir = lower(ast);
  let json = emit.grammar.to_json(lir);

  let act = new action("emit", kind.Empty);
  let target = path.join(
    path.dirname(doc.uri.fsPath),
    `${path.basename(doc.uri.fsPath, "tm")}json`,
  );
  let edit = new vscode.WorkspaceEdit();
  edit.createFile(vscode.Uri.file(target), { overwrite: true });

  console.log(json);
  edit.insert(
    vscode.Uri.file(target),
    new vscode.Position(0, 0),
    JSON.stringify(json),
  );
  act.edit = edit;
  return act;
};

const make = (out: vscode.OutputChannel): Provider => {
  return {
    provideCodeActions: (doc, range, cctx, _) => {
      return [code_emission(doc)];
    },
  };
};
