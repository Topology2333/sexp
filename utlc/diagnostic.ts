export { make };
import * as vscode from "vscode";
import { Diagnostic, Range, Position } from "vscode";
import { DiagnosticSeverity as Severity } from "vscode";
import type {ParseError} from "./parse_expr";
import { parse_expr } from "./parse_expr";

const name = "utlc";
enum Scheme { file = "file", output = "output", }
type Provider = (event: vscode.TextDocumentChangeEvent) => void;
const error: {
  readonly to_diagnostic: (self: ParseError) => Diagnostic;
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
  const prs = parse_expr(text);  // prs 现在是 { exprs: [...], errors: [...] }
  
  // 从 prs 中提取 errors
  const errors = prs.errors;
  
  // 将 errors 转换为 diagnostics
  const diagnostics = errors.map(error.to_diagnostic);
  
  // 将 diagnostics 设置到诊断集合
  dia.set(event.document.uri, diagnostics);
  
  // 可选：输出调试信息
  if (errors.length > 0) {
    out.appendLine(`[utlc] Found ${errors.length} error(s)`);
    for (const err of errors) {
      out.appendLine(`  - ${err.message} at ${err.range.start.line}:${err.range.start.character}`);
    }
  }
};
const register_diagnostic = (name: string) =>
  vscode.languages.createDiagnosticCollection(name);
const manager = register_diagnostic(name);
const make = (out: vscode.OutputChannel): Provider => {
  return e => {
    if (e.contentChanges.length === 0) return;
    if (e.document.uri.scheme === Scheme.output) return;
    if (e.document.languageId !== name) return;  // 这里应该是 "utlc"，不是 "textmate"
    handler(out, e, manager);
  };
};
