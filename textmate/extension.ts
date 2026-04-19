import * as vscode from "vscode";
import * as diagnostic from "./diagnostic";
import * as complete from "./complete";
import * as rename from "./rename";
import * as proc from "node:process";
import * as action from "./action";

const activate = (context: vscode.ExtensionContext) => {
  console.log(proc.cwd());
  const lang_id = "textmate";
  const out = vscode.window.createOutputChannel(lang_id, "log");
  const cmpl = vscode.languages.registerCompletionItemProvider(
    lang_id,
    complete.make(out),
  );
  const diag = vscode.workspace.onDidChangeTextDocument(diagnostic.make(out));
  const rn = vscode.languages.registerRenameProvider(lang_id, rename.make(out));
  const act = vscode.languages.registerCodeActionsProvider(
    lang_id,
    action.make(out),
  );
  context.subscriptions.push(cmpl, diag, rn, act, out);
};
const deactivate = () => {};

export { activate, deactivate };
