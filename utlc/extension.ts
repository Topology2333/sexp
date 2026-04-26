import * as vscode from "vscode";
import { parse_expr, type ParseError } from "./parse_expr";



function errorToDiagnostic(err: ParseError): vscode.Diagnostic {
    const { start, end } = err.range;
    const range = new vscode.Range(
        new vscode.Position(start.line, start.character),
        new vscode.Position(end.line, end.character)
    );
    return new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
}

function makeDiagnosticProvider(collection: vscode.DiagnosticCollection) {
    return (event: vscode.TextDocumentChangeEvent) => {
        const doc = event.document;

        // 只处理 UTLC 文件
        if (doc.languageId !== "utlc") return;

        // 忽略无内容变化的触发（可选，减少不必要的解析）
        if (event.contentChanges.length === 0) return;

        // 忽略特殊 scheme（如输出面板）
        if (doc.uri.scheme === "output") return;

        // 解析文档
        const text = doc.getText();
        const { errors } = parse_expr(text);

        // 生成并设置诊断
        const diagnostics = errors.map(errorToDiagnostic);
        collection.set(doc.uri, diagnostics);
    };
}


export function activate(context: vscode.ExtensionContext) {
    console.log("UTLC extension activated");

    // 1. 创建诊断集合并加入订阅（确保生命周期正确）
    const diagCollection = vscode.languages.createDiagnosticCollection("utlc");
    context.subscriptions.push(diagCollection);

    // 2. 创建诊断提供者
    const diagProvider = makeDiagnosticProvider(diagCollection);

    // 3. 监听文档变化事件
    const diagDisposable = vscode.workspace.onDidChangeTextDocument(diagProvider);
    context.subscriptions.push(diagDisposable);

    // 4. 监听文档打开事件（确保新打开的文件也能获得诊断）
    const openDisposable = vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId === "utlc") {
            const text = doc.getText();
            const { errors } = parse_expr(text);
            const diagnostics = errors.map(errorToDiagnostic);
            diagCollection.set(doc.uri, diagnostics);
        }
    });
    context.subscriptions.push(openDisposable);

    // 5. 对已打开的所有 UTLC 文件执行初始诊断
    vscode.workspace.textDocuments.forEach(doc => {
        if (doc.languageId === "utlc") {
            const text = doc.getText();
            const { errors } = parse_expr(text);
            const diagnostics = errors.map(errorToDiagnostic);
            diagCollection.set(doc.uri, diagnostics);
        }
    });

}

export function deactivate() {}