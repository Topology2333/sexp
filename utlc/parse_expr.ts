import { parser, syntax, token } from "../sexp"


type position = { line: number; character: number };
type range = { start: position; end: position };


type exp = exp.var_ | exp.abs | exp.app;
export namespace exp {
    export type var_ = { tag: "var_"; name: string };
    export type abs = { tag: "abs"; param: string; body: exp };
    export type app = { tag: "app"; func: exp; args: exp };
}

//辅助函数：提取syntax中的文本内容，并返回其在原始输入中的位置（span）
function syntax_to_span(syn: syntax, text: string): string {
        switch (syn.tag) {
                case syntax.tag.atom:
                case syntax.tag.lone:
                        return token.to_span(syn.leaf, text);
                case syntax.tag.group:
                case syntax.tag.mismatch: {
                        let open = syntax.open(syn);
                        let close = syntax.close(syn);
                        return text.slice(open.start, close.end);
                }
                default: {
                     const _exhaustive: never = syn;
                    throw new Error("Unexpected syntax tag");
}
        }
}

// 过滤掉可跳过的节点（空格、注释等）
function is_skipable(syn: syntax, text: string): boolean {
    if (syn.tag === syntax.tag.atom || syn.tag === syntax.tag.lone) {
        return syn.leaf.kind === token.kind.atom.space;
    }
    return false;
}

function parse(syn: syntax, text: string): exp {
    switch (syn.tag) {
        case syntax.tag.atom: {
            let name = syntax_to_span(syn, text);
            return { tag: "var_", name };
        }
        case syntax.tag.lone:
        case syntax.tag.mismatch:
            throw new Error("Unexpected lone or mismatched syntax node");
        case syntax.tag.group: {
            let items = syn.children.filter(x => !is_skipable(x, text));
            if (items.length < 3) {
                throw new Error("Empty group is not a valid expression");
            }

            let head = items[1]!;
            if (items.length === 5 && head.tag === syntax.tag.atom) {
                let headText = syntax_to_span(head, text);
                if (headText === "lambda") {
                    let binder = items[2]!;
                    if (binder.tag !== syntax.tag.group) {
                        throw new Error("Lambda binder must be a group");
                    }
                    let binderItems = binder.children.filter(x => !is_skipable(x, text));
                    if (binderItems.length !== 3 || binderItems[1]!.tag !== syntax.tag.atom) {
                        throw new Error("Lambda binder must contain a single identifier");
                    }
                    let param = syntax_to_span(binderItems[1]!, text);
                    let body = parse(items[3]!, text);
                    return { tag: "abs", param, body };
                }
            }

            if (items.length === 4) {
                let func = parse(items[1]!, text);
                let args = parse(items[2]!, text);
                return { tag: "app", func, args };
            }

            throw new Error("Invalid application or lambda form");
        }
        default: {
            const _exhaustive: never = syn;
            throw new Error("Unexpected syntax tag");
        }
    }
}

export function parse_expr(text: string): exp {
    let p = parser.make(text);
    let tree = parser.parse(p).filter(x => !is_skipable(x, text));
    if (tree.length !== 1) {
        throw new Error("Expected a single top-level expression");
    }
    return parse(tree[0]!, text);
}