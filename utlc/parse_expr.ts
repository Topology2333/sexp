import { parser, syntax, token } from "../sexp";

// 位置和范围类型定义
type position = { line: number; character: number };
type range = { start: position; end: position };

//AST 定义
export type exp = exp.var_ | exp.abs | exp.app;
export namespace exp {
    export type var_ = { tag: "var_"; name: string };
    export type abs = { tag: "abs"; param: string; body: exp };
    export type app = { tag: "app"; func: exp; args: exp };
}

//
class ParseError extends Error {
    readonly range?: range;

    constructor(message: string, range?: range) {
        const loc = range
            ? ` at ${range.start.line}:${range.start.character}`
            : "";
        super(`Parse error${loc}: ${message}`);
        this.range = range;
    }
}

// 从 syntax 节点获取 range（用于错误报告）
function get_range(syn: syntax): range | undefined {
    switch (syn.tag) {
        case syntax.tag.atom:
        case syntax.tag.lone:
            return token.to_range((syn as syntax.atom | syntax.lone).leaf);
        case syntax.tag.group:
        case syntax.tag.mismatch: {
            const children = (syn as syntax.group | syntax.mismatch).children;
            if (children.length === 0) return undefined;
            const first = children[0];
            const last = children[children.length - 1];
            if (first.tag === syntax.tag.atom && last.tag === syntax.tag.atom) {
                return {
                    start: token.to_start_position(first.leaf),
                    end: token.to_end_position(last.leaf)
                };
            }
            return undefined;
        }
        default:
            return undefined;
    }
}

// 提取原子节点文本 
function syntax_to_span(syn: syntax, text: string): string {
    if (syn.tag !== syntax.tag.atom) {
        throw new ParseError("Expected atom", get_range(syn));
    }
    const leaf = (syn as syntax.atom).leaf;
    return token.to_span(leaf, text);
}

// 判断是否为可跳过节点（空格/注释）
function is_skipable(syn: syntax, _text: string): boolean {
    if (syn.tag !== syntax.tag.atom) return false;
    const leaf = (syn as syntax.atom).leaf;
    return leaf.kind === token.kind.atom.space;
}

const parse = (syn: syntax, text: string): exp => {
    switch (syn.tag) {
        case syntax.tag.atom: {
            let name = syntax_to_span(syn, text);
            return { tag: "var_", name };
        }
        case syntax.tag.lone:
            throw new ParseError("Isolated bracket", get_range(syn));
        case syntax.tag.mismatch:
            throw new ParseError("Mismatched parentheses", get_range(syn));
        case syntax.tag.group: {
            let lst = syn.children.filter(x => !is_skipable(x, text));
            let open = lst[0] as syntax.atom;
            let close = lst[lst.length - 1] as syntax.atom;

            // 字符串字面量：当前语言不支持，报错
            if (open.leaf.kind === token.kind.quote.double ||
                open.leaf.kind === token.kind.quote.single ||
                open.leaf.kind === token.kind.quote.back) {
                throw new ParseError("String literals are not supported", get_range(syn));
            }

            if (lst.length >= 3) {
                let lead = syntax_to_span(lst[1]!, text);
                switch (lead) {
                    // --------------------------------------------------------
                    // λ 抽象 (lambda (x) body) 或 (lambda x body) 或 (λ x body)
                    // --------------------------------------------------------
                    case "lambda":
                    case "λ": {
                        let param: string;
                        let bodyNode: syntax;

                        // 判断参数是否被括号包围
                        if (lst[2].tag === syntax.tag.group) {
                            let paramGroup = lst[2] as syntax.group;
                            let paramChildren = paramGroup.children.filter(x => !is_skipable(x, text));
                            // 期望：'(' 标识符 ')'
                            if (paramChildren.length !== 3) {
                                throw new ParseError("Invalid parameter list", get_range(paramGroup));
                            }
                            param = syntax_to_span(paramChildren[1]!, text);
                            bodyNode = lst[3]!;
                        } else {
                            param = syntax_to_span(lst[2]!, text);
                            bodyNode = lst[3]!;
                        }

                        let body = parse(bodyNode, text);
                        return { tag: "abs", param, body };
                    }
                    default: {
                        // 至少需要一个参数
                        if (lst.length < 3) {
                            throw new ParseError("Application requires at least one argument", get_range(syn));
                        }

                        let func = parse(lst[1]!, text);
                        let args = parse(lst[2]!, text);
                        let app: exp = { tag: "app", func, args };

                        // 处理剩余参数，左结合嵌套
                        for (let i = 3; i < lst.length - 1; i++) {
                            let nextArg = parse(lst[i]!, text);
                            app = { tag: "app", func: app, args: nextArg };
                        }

                        return app;
                    }
                }
            } else {
                throw new ParseError("Malformed expression", get_range(syn));
            }
        }
        default:
            throw new ParseError("Unexpected syntax node", get_range(syn));
    }
};

export function parse_expr(text: string): exp {
    const p = parser.make(text);
    const nodes = parser.parse(p);
    if (nodes.length === 0) {
        throw new ParseError("Empty input");
    }
    return parse(nodes[0]!, text);
}
