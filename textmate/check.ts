import { syntax, token, parser } from "./sexp";
import type { position, range } from "./sexp";

export type { error, context };
export type { stmt, binding, grammar };
export type { hole, variable, identifier };
export type { typ, ty_regex, ty_pattern, ty_unit };
export type { expr };
export type { regex, concat, choice, repeat, negative, code_point, lstr };
export type { pattern, union, match, surround };
export { infer_source };

type u32 = number;

/** skip space token */
const is_skipable = (self: syntax, text: string) => {
  // prettier-ignore
  switch (self.tag) {
    case syntax.tag.atom: case syntax.tag.lone:
      return self.leaf.kind === token.kind.atom.space;
    case syntax.tag.group: case syntax.tag.mismatch:
      return false;
  }
};

type regex = concat | choice | repeat | negative | code_point | lstr;
type pattern = match | surround;
type expr = variable | regex | union | pattern | hole;
type typ = ty_regex | ty_pattern | ty_unit | hole;

type ty_regex = { tag: "ty_regex"; range: range };
type ty_pattern = { tag: "ty_pattern"; range: range };
type ty_unit = { tag: "ty_unit"; range: range };
type hole = { tag: "hole"; range: range };
type variable = { tag: "variable"; range: range; ty: typ; name: string };
type union = { tag: "union"; range: range; ty: typ; children: expr[] };

type identifier = { range: range; text: string };

// prettier-ignore
type match = { tag: "match"; range: range; ty: typ; scope: identifier; rex: expr; };

// prettier-ignore
type surround = { tag: "surround"; range: range; ty: typ; scope: identifier; begin: expr; begin_pats: expr; end: expr; end_pats: expr; patterns: expr; };

type concat = { tag: "concat"; range: range; ty: typ; children: expr[] };
type choice = { tag: "choice"; range: range; ty: typ; children: expr[] };
type repeat = { tag: "repeat"; range: range; ty: typ; rex: expr };
type negative = { tag: "negative"; range: range; ty: typ; rex: expr };
type code_point = { tag: "code_point"; range: range; ty: typ; data: number };
/** literal string */
type lstr = { tag: "lstr"; range: range; ty: typ; data: string };

type stmt = binding | grammar | hole;
type binding = {
  tag: "binding";
  range: range;
  ty: typ;
  binder: identifier;
  body: expr;
};
type grammar = { tag: "grammar"; range: range; ty: typ; name: identifier };

type error = { range: range; message: string };

const msg = {
  scope: "Scope Error: unbound variable",
  syntax: "Syntax Error: unknown",
  /** TODO */
  missing: "Syntax Error: missing",
  /** TODO */
  extra: "Syntax Error: extra",
  typ: "Type Error: mismatch",
  internal: "Internal Error: sexp parse module has bugs",
  todo: "Internal Error: TODO",
};

let syntax_to_range = (syn: syntax): range => {
  // prettier-ignore
  switch (syn.tag) {
    case syntax.tag.group: case syntax.tag.mismatch: {
      return list.to_range(syn.children)
    }
    case syntax.tag.atom: case syntax.tag.lone: {
      return token.to_range(syn.leaf)
    }
  }
};

let syntax_to_span = (syn: syntax, text: string): string => {
  if (syn.tag === syntax.tag.atom) {
    return token.to_span(syn.leaf, text);
  } else {
    return "";
  }
};
/** utility for syntax[] manipulation */
const list: {
  open: (lst: syntax[]) => range;
  close: (lst: syntax[]) => range;
  to_range: (lst: syntax[]) => range;
} = {
  open: lst => syntax_to_range(lst[0]!),
  close: lst => syntax_to_range(lst[lst.length - 1]!),
  to_range: lst => {
    let open = lst[0]! as syntax.atom;
    let close = lst[lst.length - 1]! as syntax.atom;
    let start = token.to_start_position(open.leaf);
    let end = token.to_end_position(close.leaf);
    const range = { start, end };
    return range;
  },
};

type constraint = {
  /** inference in let binding */
  actual: typ | undefined;
  /** check in elimination rule  */
  expected: typ[];
};

type context = {
  toplevel: Map<string, constraint>;
  text: string;
  report: error[];
};

type bool = boolean;

const unify = (lft: typ, rht: typ): bool => {
  // prettier-ignore
  switch (lft.tag) {
    case "ty_regex":   { switch (rht.tag) { case "hole": case "ty_regex":   return true; default: return false; } }
    case "ty_pattern": { switch (rht.tag) { case "hole": case "ty_pattern": return true; default: return false; } }
    case "ty_unit":    { switch (rht.tag) { case "hole": case "ty_unit":    return true; default: return false; } }
    case "hole":       { return true }
  }
};

/** parse helper function */
const parse_rest = <a>(
  ctx: context,
  lst: syntax[],
  f: (ctx: context, syn: syntax) => a,
  s: u32,
): a[] => {
  let rslt: a[] = new Array(lst.length - s - 1);
  for (let i = s, j = 0; i < lst.length - 1; i++, j++) {
    rslt[j] = f(ctx, lst[i]!);
  }
  return rslt;
};

let infer_lstr = (ctx: context, lst: syntax[]): lstr => {
  const { text } = ctx;
  const range = list.to_range(lst);
  const open = lst[0]! as syntax.atom;
  const close = lst[lst.length - 1]! as syntax.atom;
  const start = open.leaf.start + open.leaf.length;
  const end = close.leaf.start;
  const data = text.slice(start, end);
  const ty: typ = { tag: "ty_regex", range };
  return { tag: "lstr", ty, range, data };
};

let infer_concat = (ctx: context, lst: syntax[]): concat => {
  const children = parse_rest(ctx, lst, infer_expr, 2);
  const range = list.to_range(lst);
  for (const child of children) {
    const ty: typ = { tag: "ty_regex", range: child.range };
    check(ctx, child, ty);
  }
  const ty: typ = { tag: "ty_regex", range };
  return { tag: "concat", range, ty, children };
};

let infer_choice = (ctx: context, lst: syntax[]): choice => {
  const children = parse_rest(ctx, lst, infer_expr, 2);
  const range = list.to_range(lst);
  for (const child of children) {
    const ty: typ = { tag: "ty_regex", range: child.range };
    check(ctx, child, ty);
  }
  const ty: typ = { tag: "ty_regex", range };
  return { tag: "choice", range, ty, children };
};

let infer_union = (ctx: context, lst: syntax[]): union => {
  const children = parse_rest(ctx, lst, infer_expr, 2);
  const range = list.to_range(lst);
  for (const child of children) {
    const ty: typ = { tag: "ty_pattern", range: child.range };
    check(ctx, child, ty);
  }
  const ty: typ = { tag: "ty_pattern", range };
  return { tag: "union", range, ty, children };
};

let infer_repeat = (ctx: context, lst: syntax[]): repeat => {
  const range = list.to_range(lst);
  let rex: expr;
  if (lst.length >= 4) {
    rex = infer_expr(ctx, lst[2]);
  } else {
    rex = { tag: "hole", range };
  }
  const ty_regex: ty_regex = { tag: "ty_regex", range: rex.range };
  check(ctx, rex, ty_regex);
  const ty: typ = { tag: "ty_regex", range };
  return { tag: "repeat", range, ty, rex };
};

let infer_negative = (ctx: context, lst: syntax[]): negative => {
  const range = list.to_range(lst);
  let rex: expr;
  if (lst.length >= 4) {
    rex = infer_expr(ctx, lst[2]);
  } else {
    rex = { tag: "hole", range };
  }
  const ty_regex: ty_regex = { tag: "ty_regex", range: rex.range };
  check(ctx, rex, ty_regex);
  const ty: typ = { tag: "ty_regex", range };
  return { tag: "negative", range, ty, rex };
};

const parse_identifier = (ctx: context, syn: syntax): identifier => {
  let range = syntax_to_range(syn);
  if (syn.tag === syntax.tag.atom) {
    return { text: token.to_span(syn.leaf, ctx.text), range };
  } else {
    return { text: "_", range };
  }
};

let infer_match = (ctx: context, lst: syntax[]): expr => {
  const { text, report } = ctx;
  const close = syntax_to_range(lst[lst.length - 1]);
  const range = list.to_range(lst);
  let scope: identifier;
  if (lst.length >= 4) {
    scope = parse_identifier(ctx, lst[2]);
  } else {
    scope = { range: close, text: "_" };
    const err: error = { range: close, message: msg.syntax };
    report.push(err);
  }
  let rex: expr;
  if (lst.length >= 5) {
    rex = infer_expr(ctx, lst[3]);
  } else {
    rex = { tag: "hole", range: close };
  }
  const ty_regex: ty_regex = { tag: "ty_regex", range: rex.range };
  check(ctx, rex, ty_regex);
  const ty: ty_pattern = { tag: "ty_pattern", range };
  return { tag: "match", range, ty, scope, rex };
};

let infer_surround = (ctx: context, lst: syntax[]): expr => {
  const { text, report } = ctx;
  const close = syntax_to_range(lst[lst.length - 1]);
  const range = list.to_range(lst);

  let scope: identifier;
  if (lst.length >= 4) {
    scope = parse_identifier(ctx, lst[2]);
  } else {
    scope = { range: close, text: "_" };
    const err: error = { range: close, message: msg.syntax };
    report.push(err);
  }
  let begin: expr;
  if (lst.length >= 5) {
    begin = infer_expr(ctx, lst[3]);
  } else {
    begin = { tag: "hole", range: close };
    const err: error = { range: close, message: msg.syntax };
    report.push(err);
  }
  let begin_pats: expr;
  if (lst.length >= 6) {
    begin_pats = infer_expr(ctx, lst[4]);
  } else {
    begin_pats = { tag: "hole", range: close };
    const err: error = { range: close, message: msg.syntax };
    report.push(err);
  }

  let end: expr;
  if (lst.length >= 7) {
    end = infer_expr(ctx, lst[5]);
  } else {
    end = { tag: "hole", range: close };
    const err: error = { range: close, message: msg.syntax };
    report.push(err);
  }
  let end_pats: expr;
  if (lst.length >= 8) {
    end_pats = infer_expr(ctx, lst[6]);
  } else {
    end_pats = { tag: "hole", range: close };
    const err: error = { range: close, message: msg.syntax };
    report.push(err);
  }
  let patterns: expr;
  if (lst.length >= 9) {
    patterns = infer_expr(ctx, lst[7]);
  } else {
    patterns = { tag: "hole", range: close };
    const err: error = { range: close, message: msg.syntax };
    report.push(err);
  }
  check(ctx, begin, { tag: "ty_regex", range: begin.range });
  check(ctx, end, { tag: "ty_regex", range: end.range });
  check(ctx, begin_pats, { tag: "ty_pattern", range: begin_pats.range });
  check(ctx, end_pats, { tag: "ty_pattern", range: end_pats.range });
  check(ctx, patterns, { tag: "ty_pattern", range: patterns.range });
  const ty: ty_pattern = { tag: "ty_pattern", range };
  // prettier-ignore
  return { tag: "surround", range, ty, scope, begin, begin_pats, end, end_pats, patterns, };
};

const regex_integer = /^\d+$/;

let infer_expr = (ctx: context, syn: syntax): expr => {
  const { text, report } = ctx;
  const range = syntax_to_range(syn);
  switch (syn.tag) {
    case syntax.tag.atom: {
      const span = token.to_span(syn.leaf, text);
      if (regex_integer.test(span)) {
        const data = parseInt(span);
        const ty: typ = { tag: "ty_regex", range };
        return { tag: "code_point", range, ty, data };
      } else {
        const ty: typ = { tag: "hole", range };
        return { tag: "variable", range, ty, name: span };
      }
    }
    case syntax.tag.lone: {
      const err: error = { range, message: msg.syntax };
      report.push(err);
      return { tag: "hole", range };
    }
    case syntax.tag.mismatch:
    case syntax.tag.group: {
      if (syn.tag === syntax.tag.mismatch) {
        const err: error = { range, message: msg.syntax };
        report.push(err);
      }
      const lst = syn.children.filter(x => !is_skipable(x, text));
      const open = lst[0] as syntax.atom;
      const close = lst[lst.length - 1] as syntax.atom;

      if (
        open.leaf.kind === token.kind.quote.double &&
        close.leaf.kind === token.kind.quote.double
      ) {
        return infer_lstr(ctx, lst);
      }
      if (lst.length >= 3) {
        const lead = syntax_to_span(lst[1], text);
        // prettier-ignore
        switch (lead) {
          case "match": return infer_match(ctx,lst)
          case "concat": return infer_concat(ctx,lst) 
          case "repeat": return infer_repeat(ctx,lst)
          case "choice": return infer_choice(ctx,lst)
          case "surround": return infer_surround(ctx,lst)
          case "negative": return infer_negative(ctx,lst)
          case "union": return infer_union(ctx,lst)
          default: break;
        }
      }
      const err: error = { message: msg.syntax, range };
      report.push(err);
      return { tag: "hole", range };
    }
  }
};

let infer_let = (ctx: context, lst: syntax[]): stmt => {
  const { text, report } = ctx;
  const range = list.to_range(lst);
  const close = list.close(lst);
  let binder: identifier;
  if (lst.length >= 4) {
    binder = parse_identifier(ctx, lst[2]);
  } else {
    binder = { range: close, text: "_" };
  }
  let body: expr;
  if (lst.length >= 5) {
    body = infer_expr(ctx, lst[3]);
  } else {
    body = { tag: "hole", range: close };
  }

  let actual: typ;
  // prettier-ignore
  switch (body.tag) {
      case "hole": { actual = { tag: "hole", range }; break; }
      default: { actual = body.ty; break; }
  }
  let constraint = ctx.toplevel.get(binder.text);
  if (constraint !== undefined) {
    constraint.actual = actual;
  } else {
    const expected: typ[] = [];
    ctx.toplevel.set(binder.text, { actual, expected });
  }
  const ty: ty_unit = { tag: "ty_unit", range };
  return { tag: "binding", range, ty: ty, binder, body };
};
let infer_grammar = (ctx: context, lst: syntax[]): stmt => {
  const { text, report } = ctx;
  const range = list.to_range(lst);
  const close = list.close(lst);
  let ident: identifier;
  if (lst.length >= 4) {
    ident = parse_identifier(ctx, lst[2]);
  } else {
    ident = { range: close, text: "_" };
  }
  const actual: typ = { tag: "ty_pattern", range };
  let constraint = ctx.toplevel.get(ident.text);
  if (constraint !== undefined) {
    constraint.actual = actual;
  } else {
    ctx.toplevel.set(ident.text, {
      actual,
      expected: [],
    });
  }
  const ty: ty_unit = { tag: "ty_unit", range };
  return { tag: "grammar", range, ty, name: ident };
};

let infer_stmt = (ctx: context, syn: syntax): stmt => {
  const { text, report } = ctx;
  const range = syntax_to_range(syn);

  switch (syn.tag) {
    case syntax.tag.atom:
    case syntax.tag.lone: {
      const err: error = { range, message: msg.syntax };
      report.push(err);
      return { tag: "hole", range };
    }
    case syntax.tag.mismatch:
    case syntax.tag.group: {
      if (syn.tag === syntax.tag.mismatch) {
        const err: error = { range, message: msg.syntax };
        report.push(err);
      }
      const lst = syn.children.filter(x => !is_skipable(x, text));
      if (lst.length >= 3) {
        const lead = syntax_to_span(lst[1], text);
        // prettier-ignore
        switch (lead) {
          case "grammar": return infer_grammar(ctx,lst)
          case "let": return infer_let(ctx,lst) 
          default: break;
        }
      }
      const err: error = { message: msg.syntax, range };
      report.push(err);
      return { tag: "hole", range };
    }
  }
};

let check_mutual_recursion = (ctx: context): void => {
  const { toplevel, report } = ctx;
  for (let [name, constraint] of toplevel) {
    for (let exp of constraint.expected) {
      if (constraint.actual === undefined) {
        report.push({ range: exp.range, message: msg.scope });
        break;
      }
      if (!unify(constraint.actual, exp)) {
        report.push({ range: exp.range, message: msg.typ });
      }
    }
  }
};

let check = (ctx: context, ex: expr, ty: typ): void => {
  const { report } = ctx;
  switch (ex.tag) {
    case "hole":
      return;
    case "variable": {
      let constraint = ctx.toplevel.get(ex.name);
      if (constraint !== undefined) {
        constraint.expected.push(ty);
      } else {
        ctx.toplevel.set(ex.name, { actual: undefined, expected: [ty] });
      }
      return;
    }
    default: {
      let act = ex.ty;
      if (!unify(act, ty)) {
        const err: error = { range: ex.range, message: msg.typ };
        report.push(err);
      }
      return;
    }
  }
};

let infer_source = (ctx: context, lst: syntax[]): stmt[] => {
  let tmp = lst.filter(x => !is_skipable(x, ctx.text));
  let rslt = tmp.map(x => infer_stmt(ctx, x));
  check_mutual_recursion(ctx);
  return rslt;
};
