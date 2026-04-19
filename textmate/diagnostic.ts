import { syntax, token, parser } from "./sexp";
import type { position, range } from "./sexp";
import type { error, context } from "./check";
import { infer_source } from "./check";
import * as vscode from "vscode";
import { Diagnostic, Range, Position } from "vscode";
import { DiagnosticSeverity as Severity } from "vscode";

export { make };

type Provider = (event: vscode.TextDocumentChangeEvent) => void;
// prettier-ignore
enum Scheme { file = "file", output = "output", }

const error: {
  readonly to_diagnostic: (self: error) => Diagnostic;
} = {
  to_diagnostic: self => {
    let {
      range: { start, end },
      message,
    } = self;
    const pstart = new Position(start.line, start.character);
    const pend = new Position(end.line, end.character);
    const range = new Range(pstart, pend);
    const rslt = new Diagnostic(range, message, Severity.Error);
    return rslt;
  },
};

const handler = (
  out: vscode.OutputChannel,
  event: vscode.TextDocumentChangeEvent,
  dia: vscode.DiagnosticCollection,
): void => {
  const text = event.document.getText();
  const prs = parser.make(text);
  const sexp = parser.parse(prs);
  const ctx: context = {
    toplevel: new Map(),
    report: [],
    text,
  };

  infer_source(ctx, sexp);
  let items = ctx.report.map(error.to_diagnostic);
  dia.set(event.document.uri, items);
};

const register_diagnostic = (name: string) =>
  vscode.languages.createDiagnosticCollection(name);

const manager = register_diagnostic("sexp");

const make = (out: vscode.OutputChannel): Provider => {
  return e => {
    if (e.contentChanges.length === 0) return;
    if (e.document.uri.scheme === Scheme.output) return;
    if (e.document.languageId !== "textmate") return;
    handler(out, e, manager);
  };
};
