"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"));

// sexp.ts
var impossible = class extends Error {
};
var str = {
  code_unit_at: (s, i) => {
    return s.charCodeAt(i);
  },
  repeat: (n, s) => {
    return s.repeat(n);
  }
};
var array = {
  truncate: (xs, s) => {
    return xs.length = s;
  },
  flatten: (xs) => {
    return xs.flat();
  },
  drain: (xs, s, e) => {
    return xs.splice(s, e - s);
  },
  join: (xs, sep) => {
    return xs.join(sep);
  },
  map: (xs, f) => {
    return xs.map(f);
  },
  mapi: (xs, f) => {
    return xs.map((x, i) => f(i, x));
  },
  copy_nonoverlapping: (src, sofs, dst, dofs, len) => {
    for (let i = sofs, j = dofs; j < dofs + len; i++, j++) {
      dst[j] = src[i];
    }
  }
};
var parenthesis = { left: 1, right: 2 };
var curly_bracket = { left: 3, right: 4 };
var square_bracket = { left: 5, right: 6 };
var quote = { single: 7, double: 8, back: 9 };
var atom = { identifier: 10, space: 11 };
var kind = {
  atom,
  quote,
  square_bracket,
  curly_bracket,
  parenthesis,
  debug: (x) => {
    switch (x) {
      case parenthesis.left:
        return "parenthesis.left";
      case parenthesis.right:
        return "parenthesis.right";
      case curly_bracket.left:
        return "curly_bracket.left";
      case curly_bracket.right:
        return "curly_bracket.right";
      case square_bracket.left:
        return "square_bracket.left";
      case square_bracket.right:
        return "square_bracket.right";
      case quote.single:
        return "quote.single";
      case quote.double:
        return "quote.double";
      case quote.back:
        return "quote.back";
      case atom.identifier:
        return "atom.identifier";
      case atom.space:
        return "atom.space";
      default:
        throw new impossible();
    }
  }
};
var token = {
  debug: (x) => {
    return `{ kind: ${kind.debug(x.kind)}, line: ${x.line}, character: ${x.character}, length: ${x.length}, start: ${x.start}, end: ${x.end} }`;
  },
  to_start_position: (self) => {
    return {
      line: self.line,
      character: self.character
    };
  },
  to_end_position: (self) => {
    return {
      line: self.line,
      character: self.character + self.length
    };
  },
  to_span: (self, text) => {
    return text.slice(self.start, self.end);
  },
  to_range: (self) => {
    let start = token.to_start_position(self);
    let end = token.to_end_position(self);
    const range = { start, end };
    return range;
  },
  kind
};
var delimiter = {
  parenthesis: {
    /** `(` */
    left: 40,
    /** `)` */
    right: 41
  },
  square_bracket: {
    /** `[` */
    left: 91,
    /** `]` */
    right: 93
  },
  curly_bracket: {
    /** `{` */
    left: 123,
    /** `}` */
    right: 125
  },
  quote: {
    /** `'` */
    single: 39,
    /** `"` */
    double: 34,
    /** `` ` `` */
    back: 96
  }
};
var control = {
  tabulation: {
    /** horizontal tabulation (HT) */
    horizontal: 9,
    /** vertical tabulation (VT) */
    vertical: 11
  },
  /** line feed (LF) */
  line_feed: 10
};
var whitespace = {
  space: 32
};
var lexer = {
  make: (text) => {
    return { text, line: 0, character: 0, start: 0 };
  },
  next: (self) => {
    const pch = self.character;
    const pln = self.line;
    const pst = self.start;
    let ch = pch;
    let ln = pln;
    let st = pst;
    let len = 0;
    if (st < self.text.length) {
      let cu = str.code_unit_at(self.text, st);
      let kind4;
      switch (cu) {
        case delimiter.parenthesis.left:
          st++;
          ch++;
          len++;
          kind4 = parenthesis.left;
          break;
        case delimiter.parenthesis.right:
          st++;
          ch++;
          len++;
          kind4 = parenthesis.right;
          break;
        case delimiter.square_bracket.left:
          st++;
          ch++;
          len++;
          kind4 = square_bracket.left;
          break;
        case delimiter.square_bracket.right:
          st++;
          ch++;
          len++;
          kind4 = square_bracket.right;
          break;
        case delimiter.curly_bracket.left:
          st++;
          ch++;
          len++;
          kind4 = curly_bracket.left;
          break;
        case delimiter.curly_bracket.right:
          st++;
          ch++;
          len++;
          kind4 = curly_bracket.right;
          break;
        case delimiter.quote.single:
          st++;
          ch++;
          len++;
          kind4 = quote.single;
          break;
        case delimiter.quote.double:
          st++;
          ch++;
          len++;
          kind4 = quote.double;
          break;
        case delimiter.quote.back:
          st++;
          ch++;
          len++;
          kind4 = quote.back;
          break;
        case control.line_feed:
          st++;
          ch = 0;
          len++;
          ln++;
          loop: while (st < self.text.length) {
            let cu2 = str.code_unit_at(self.text, st);
            switch (cu2) {
              case control.line_feed:
                st++;
                ch = 0;
                len++;
                ln++;
                continue loop;
              case control.tabulation.horizontal:
              case control.tabulation.vertical:
              case whitespace.space:
                st++;
                ch++;
                len++;
                continue loop;
              default:
                break loop;
            }
          }
          kind4 = atom.space;
          break;
        case control.tabulation.horizontal:
        case control.tabulation.vertical:
        case whitespace.space:
          st++;
          ch++;
          len++;
          loop: while (st < self.text.length) {
            let cu2 = str.code_unit_at(self.text, st);
            switch (cu2) {
              case control.line_feed:
                st++;
                ch = 0;
                len++;
                ln++;
                continue loop;
              case control.tabulation.horizontal:
              case control.tabulation.vertical:
              case whitespace.space:
                st++;
                ch++;
                len++;
                continue loop;
              default:
                break loop;
            }
          }
          kind4 = atom.space;
          break;
        default:
          st++;
          ch++;
          len++;
          loop: while (st < self.text.length) {
            let cu2 = str.code_unit_at(self.text, st);
            switch (cu2) {
              case delimiter.parenthesis.left:
              case delimiter.parenthesis.right:
              case delimiter.square_bracket.left:
              case delimiter.square_bracket.right:
              case delimiter.curly_bracket.left:
              case delimiter.curly_bracket.right:
              case delimiter.quote.single:
              case delimiter.quote.double:
              case delimiter.quote.back:
              case control.line_feed:
              case control.tabulation.horizontal:
              case control.tabulation.vertical:
              case whitespace.space:
                break loop;
              default:
                st++;
                ch++;
                len++;
                continue loop;
            }
          }
          kind4 = atom.identifier;
          break;
      }
      self.start = st;
      self.character = ch;
      self.line = ln;
      let tok = { kind: kind4, line: pln, character: pch, length: len, start: pst, end: st };
      return tok;
    } else {
      return void 0;
    }
  }
};
var tag = { atom: 1, lone: 2, group: 3, mismatch: 4 };
var skeleton = {
  debug: (self) => {
    switch (self.tag) {
      case tag.atom:
      case tag.lone: {
        return token.kind.debug(self.leaf.kind);
      }
      case tag.group:
      case tag.mismatch: {
        return `(${self.children.map(skeleton.debug).join(" ")})`;
      }
    }
  }
};
var syntax = {
  // prettier-ignore
  group: (children) => {
    return { tag: tag.group, children };
  },
  // prettier-ignore
  mismatch: (children) => {
    return { tag: tag.mismatch, children };
  },
  // prettier-ignore
  atom: (leaf) => {
    return { tag: tag.atom, leaf };
  },
  // prettier-ignore
  lone: (leaf) => {
    return { tag: tag.lone, leaf };
  },
  debug: (self) => {
    switch (self.tag) {
      case tag.atom:
      case tag.lone: {
        return token.debug(self.leaf);
      }
      case tag.group:
      case tag.mismatch: {
        return `{ ${self.children.map(syntax.debug).join(",")} }`;
      }
    }
  },
  // prettier-ignore
  open: (self) => {
    return self.children[0].leaf;
  },
  // prettier-ignore
  close: (self) => {
    return self.children[self.children.length - 1].leaf;
  },
  tag,
  skeleton
};
var parser = {
  make: (text) => {
    return {
      lexer: lexer.make(text),
      pending: [],
      stack: []
    };
  },
  matching: (self, frame, token5) => {
    switch (frame.token.kind) {
      // atom | right 
      case atom.space:
      case atom.identifier:
      case parenthesis.right:
      case square_bracket.right:
      case curly_bracket.right:
        throw new impossible();
      case parenthesis.left:
        switch (token5.kind) {
          // matching
          case parenthesis.right:
            {
              let syn = syntax.group(parser.reduce(self, frame, token5));
              self.pending.push(syn);
            }
            break;
          // mismatch
          case curly_bracket.right:
          case square_bracket.right:
            {
              let syn = syntax.mismatch(parser.reduce(self, frame, token5));
              self.pending.push(syn);
            }
            break;
          // (left,atom)
          case atom.space:
          case atom.identifier:
            {
              self.stack.push(frame);
              parser.shift(self, token5);
            }
            break;
          // (left, quote | left)
          case parenthesis.left:
          case square_bracket.left:
          case curly_bracket.left:
          case quote.single:
          case quote.double:
          case quote.back:
            {
              self.stack.push(frame);
              parser.nest(self, token5);
            }
            break;
          default:
            throw new impossible();
        }
        break;
      case square_bracket.left:
        switch (token5.kind) {
          // matching
          case square_bracket.right:
            {
              let syn = syntax.group(parser.reduce(self, frame, token5));
              self.pending.push(syn);
            }
            break;
          // mismatch
          case parenthesis.right:
          case curly_bracket.right:
            {
              let syn = syntax.mismatch(parser.reduce(self, frame, token5));
              self.pending.push(syn);
            }
            break;
          // (left,atom)
          case atom.space:
          case atom.identifier:
            {
              self.stack.push(frame);
              parser.shift(self, token5);
            }
            break;
          // (left, quote | left)
          case parenthesis.left:
          case square_bracket.left:
          case curly_bracket.left:
          case quote.single:
          case quote.double:
          case quote.back:
            {
              self.stack.push(frame);
              parser.nest(self, token5);
            }
            break;
          default:
            throw new impossible();
        }
        break;
      case curly_bracket.left:
        switch (token5.kind) {
          // matching
          case curly_bracket.right:
            {
              let syn = syntax.group(parser.reduce(self, frame, token5));
              self.pending.push(syn);
            }
            break;
          // mismatch
          case parenthesis.right:
          case square_bracket.right:
            {
              let syn = syntax.mismatch(parser.reduce(self, frame, token5));
              self.pending.push(syn);
            }
            break;
          // (left,atom)
          case atom.space:
          case atom.identifier:
            {
              self.stack.push(frame);
              parser.shift(self, token5);
            }
            break;
          // (left, quote | left)
          case parenthesis.left:
          case square_bracket.left:
          case curly_bracket.left:
          case quote.single:
          case quote.double:
          case quote.back:
            {
              self.stack.push(frame);
              parser.nest(self, token5);
            }
            break;
          default:
            throw new impossible();
        }
        break;
      case quote.back:
        {
          switch (token5.kind) {
            // matching
            case quote.back:
              {
                let syn = syntax.group(parser.reduce(self, frame, token5));
                self.pending.push(syn);
              }
              break;
            // mismatch
            case quote.single:
            case quote.double:
              {
                let syn = syntax.mismatch(parser.reduce(self, frame, token5));
                self.pending.push(syn);
              }
              break;
            // (quote,right)
            case parenthesis.right:
            case square_bracket.right:
            case curly_bracket.right:
              {
                self.stack.push(frame);
                parser.retain(self, token5);
              }
              break;
            // (quote,left)
            case parenthesis.left:
            case square_bracket.left:
            case curly_bracket.left:
              {
                self.stack.push(frame);
                parser.nest(self, token5);
              }
              break;
            // (quote,atom)
            case atom.space:
            case atom.identifier:
              {
                self.stack.push(frame);
                parser.shift(self, token5);
              }
              break;
            default:
              throw new impossible();
          }
        }
        break;
      case quote.single:
        {
          switch (token5.kind) {
            // matching
            case quote.single:
              {
                let syn = syntax.group(parser.reduce(self, frame, token5));
                self.pending.push(syn);
              }
              break;
            // mismatch
            case quote.back:
            case quote.double:
              {
                let syn = syntax.mismatch(parser.reduce(self, frame, token5));
                self.pending.push(syn);
              }
              break;
            // (quote,right)
            case parenthesis.right:
            case square_bracket.right:
            case curly_bracket.right:
              {
                self.stack.push(frame);
                parser.retain(self, token5);
              }
              break;
            // (quote,left)
            case parenthesis.left:
            case square_bracket.left:
            case curly_bracket.left:
              {
                self.stack.push(frame);
                parser.nest(self, token5);
              }
              break;
            // (quote,atom)
            case atom.space:
            case atom.identifier:
              {
                self.stack.push(frame);
                parser.shift(self, token5);
              }
              break;
            default:
              throw new impossible();
          }
        }
        break;
      case quote.double:
        {
          switch (token5.kind) {
            // matching
            case quote.double:
              {
                let syn = syntax.group(parser.reduce(self, frame, token5));
                self.pending.push(syn);
              }
              break;
            // mismatch
            case quote.back:
            case quote.single:
              {
                let syn = syntax.mismatch(parser.reduce(self, frame, token5));
                self.pending.push(syn);
              }
              break;
            // (quote,right)
            case parenthesis.right:
            case square_bracket.right:
            case curly_bracket.right:
              {
                self.stack.push(frame);
                parser.retain(self, token5);
              }
              break;
            // (quote,left)
            case parenthesis.left:
            case square_bracket.left:
            case curly_bracket.left:
              {
                self.stack.push(frame);
                parser.nest(self, token5);
              }
              break;
            // (quote,atom)
            case atom.space:
            case atom.identifier:
              {
                self.stack.push(frame);
                parser.shift(self, token5);
              }
              break;
            default:
              throw new impossible();
          }
        }
        break;
      default:
        throw new impossible();
    }
  },
  advance: (self, tok) => {
    switch (tok.kind) {
      case parenthesis.left:
      case square_bracket.left:
      case curly_bracket.left:
      case quote.single:
      case quote.double:
      case quote.back:
        parser.nest(self, tok);
        return;
      case atom.space:
      case atom.identifier:
        parser.shift(self, tok);
        return;
      case parenthesis.right:
      case square_bracket.right:
      case curly_bracket.right:
        parser.retain(self, tok);
        return;
    }
  },
  reduce: (self, frame, tok) => {
    let rslt = new Array(2 + self.pending.length - frame.start);
    let open = syntax.atom(frame.token);
    rslt[0] = open;
    for (let i = frame.start, j = 1; i < self.pending.length; i++, j++) {
      rslt[j] = self.pending[i];
    }
    array.truncate(self.pending, frame.start);
    let close = syntax.atom(tok);
    rslt[rslt.length - 1] = close;
    return rslt;
  },
  nest: (self, token5) => {
    let open = { start: self.pending.length, token: token5 };
    self.stack.push(open);
  },
  shift: (self, tok) => {
    let syn = syntax.atom(tok);
    self.pending.push(syn);
  },
  retain: (self, tok) => {
    let syn = syntax.lone(tok);
    self.pending.push(syn);
  },
  parse: (self) => {
    loop: while (true) {
      let tok = lexer.next(self.lexer);
      if (tok !== void 0) {
        let open = self.stack.pop();
        if (open !== void 0) {
          parser.matching(self, open, tok);
        } else {
          parser.advance(self, tok);
        }
        continue loop;
      } else {
        break loop;
      }
    }
    if (self.stack.length === 0) {
      return self.pending;
    } else {
      let dst = new Array(self.pending.length + self.stack.length);
      let src = self.pending;
      let i = 0;
      let j = 0;
      let prev = 0;
      for (const frame of self.stack) {
        let len2 = frame.start - prev;
        let val = syntax.lone(frame.token);
        array.copy_nonoverlapping(src, i, dst, j, len2);
        i += len2;
        j += len2;
        dst[j] = val;
        j++;
        prev = frame.start;
      }
      let len = src.length - i;
      array.copy_nonoverlapping(src, i, dst, j, len);
      return dst;
    }
  }
};

// check.ts
var is_skipable = (self, text) => {
  switch (self.tag) {
    case syntax.tag.atom:
    case syntax.tag.lone:
      return self.leaf.kind === token.kind.atom.space;
    case syntax.tag.group:
    case syntax.tag.mismatch:
      return false;
  }
};
var msg = {
  scope: "Scope Error: unbound variable",
  syntax: "Syntax Error: unknown",
  /** TODO */
  missing: "Syntax Error: missing",
  /** TODO */
  extra: "Syntax Error: extra",
  typ: "Type Error: mismatch",
  internal: "Internal Error: sexp parse module has bugs",
  todo: "Internal Error: TODO"
};
var syntax_to_range = (syn) => {
  switch (syn.tag) {
    case syntax.tag.group:
    case syntax.tag.mismatch: {
      return list.to_range(syn.children);
    }
    case syntax.tag.atom:
    case syntax.tag.lone: {
      return token.to_range(syn.leaf);
    }
  }
};
var syntax_to_span = (syn, text) => {
  if (syn.tag === syntax.tag.atom) {
    return token.to_span(syn.leaf, text);
  } else {
    return "";
  }
};
var list = {
  open: (lst) => syntax_to_range(lst[0]),
  close: (lst) => syntax_to_range(lst[lst.length - 1]),
  to_range: (lst) => {
    let open = lst[0];
    let close = lst[lst.length - 1];
    let start = token.to_start_position(open.leaf);
    let end = token.to_end_position(close.leaf);
    const range = { start, end };
    return range;
  }
};
var unify = (lft, rht) => {
  switch (lft.tag) {
    case "ty_regex": {
      switch (rht.tag) {
        case "hole":
        case "ty_regex":
          return true;
        default:
          return false;
      }
    }
    case "ty_pattern": {
      switch (rht.tag) {
        case "hole":
        case "ty_pattern":
          return true;
        default:
          return false;
      }
    }
    case "ty_unit": {
      switch (rht.tag) {
        case "hole":
        case "ty_unit":
          return true;
        default:
          return false;
      }
    }
    case "hole": {
      return true;
    }
  }
};
var parse_rest = (ctx, lst, f, s) => {
  let rslt = new Array(lst.length - s - 1);
  for (let i = s, j = 0; i < lst.length - 1; i++, j++) {
    rslt[j] = f(ctx, lst[i]);
  }
  return rslt;
};
var infer_lstr = (ctx, lst) => {
  const { text } = ctx;
  const range = list.to_range(lst);
  const open = lst[0];
  const close = lst[lst.length - 1];
  const start = open.leaf.start + open.leaf.length;
  const end = close.leaf.start;
  const data = text.slice(start, end);
  const ty = { tag: "ty_regex", range };
  return { tag: "lstr", ty, range, data };
};
var infer_concat = (ctx, lst) => {
  const children = parse_rest(ctx, lst, infer_expr, 2);
  const range = list.to_range(lst);
  for (const child of children) {
    const ty2 = { tag: "ty_regex", range: child.range };
    check(ctx, child, ty2);
  }
  const ty = { tag: "ty_regex", range };
  return { tag: "concat", range, ty, children };
};
var infer_choice = (ctx, lst) => {
  const children = parse_rest(ctx, lst, infer_expr, 2);
  const range = list.to_range(lst);
  for (const child of children) {
    const ty2 = { tag: "ty_regex", range: child.range };
    check(ctx, child, ty2);
  }
  const ty = { tag: "ty_regex", range };
  return { tag: "choice", range, ty, children };
};
var infer_union = (ctx, lst) => {
  const children = parse_rest(ctx, lst, infer_expr, 2);
  const range = list.to_range(lst);
  for (const child of children) {
    const ty2 = { tag: "ty_pattern", range: child.range };
    check(ctx, child, ty2);
  }
  const ty = { tag: "ty_pattern", range };
  return { tag: "union", range, ty, children };
};
var infer_repeat = (ctx, lst) => {
  const range = list.to_range(lst);
  let rex;
  if (lst.length >= 4) {
    rex = infer_expr(ctx, lst[2]);
  } else {
    rex = { tag: "hole", range };
  }
  const ty_regex = { tag: "ty_regex", range: rex.range };
  check(ctx, rex, ty_regex);
  const ty = { tag: "ty_regex", range };
  return { tag: "repeat", range, ty, rex };
};
var infer_negative = (ctx, lst) => {
  const range = list.to_range(lst);
  let rex;
  if (lst.length >= 4) {
    rex = infer_expr(ctx, lst[2]);
  } else {
    rex = { tag: "hole", range };
  }
  const ty_regex = { tag: "ty_regex", range: rex.range };
  check(ctx, rex, ty_regex);
  const ty = { tag: "ty_regex", range };
  return { tag: "negative", range, ty, rex };
};
var parse_identifier = (ctx, syn) => {
  let range = syntax_to_range(syn);
  if (syn.tag === syntax.tag.atom) {
    return { text: token.to_span(syn.leaf, ctx.text), range };
  } else {
    return { text: "_", range };
  }
};
var infer_match = (ctx, lst) => {
  const { text, report } = ctx;
  const close = syntax_to_range(lst[lst.length - 1]);
  const range = list.to_range(lst);
  let scope;
  if (lst.length >= 4) {
    scope = parse_identifier(ctx, lst[2]);
  } else {
    scope = { range: close, text: "_" };
    const err = { range: close, message: msg.syntax };
    report.push(err);
  }
  let rex;
  if (lst.length >= 5) {
    rex = infer_expr(ctx, lst[3]);
  } else {
    rex = { tag: "hole", range: close };
  }
  const ty_regex = { tag: "ty_regex", range: rex.range };
  check(ctx, rex, ty_regex);
  const ty = { tag: "ty_pattern", range };
  return { tag: "match", range, ty, scope, rex };
};
var infer_surround = (ctx, lst) => {
  const { text, report } = ctx;
  const close = syntax_to_range(lst[lst.length - 1]);
  const range = list.to_range(lst);
  let scope;
  if (lst.length >= 4) {
    scope = parse_identifier(ctx, lst[2]);
  } else {
    scope = { range: close, text: "_" };
    const err = { range: close, message: msg.syntax };
    report.push(err);
  }
  let begin;
  if (lst.length >= 5) {
    begin = infer_expr(ctx, lst[3]);
  } else {
    begin = { tag: "hole", range: close };
    const err = { range: close, message: msg.syntax };
    report.push(err);
  }
  let begin_pats;
  if (lst.length >= 6) {
    begin_pats = infer_expr(ctx, lst[4]);
  } else {
    begin_pats = { tag: "hole", range: close };
    const err = { range: close, message: msg.syntax };
    report.push(err);
  }
  let end;
  if (lst.length >= 7) {
    end = infer_expr(ctx, lst[5]);
  } else {
    end = { tag: "hole", range: close };
    const err = { range: close, message: msg.syntax };
    report.push(err);
  }
  let end_pats;
  if (lst.length >= 8) {
    end_pats = infer_expr(ctx, lst[6]);
  } else {
    end_pats = { tag: "hole", range: close };
    const err = { range: close, message: msg.syntax };
    report.push(err);
  }
  let patterns;
  if (lst.length >= 9) {
    patterns = infer_expr(ctx, lst[7]);
  } else {
    patterns = { tag: "hole", range: close };
    const err = { range: close, message: msg.syntax };
    report.push(err);
  }
  check(ctx, begin, { tag: "ty_regex", range: begin.range });
  check(ctx, end, { tag: "ty_regex", range: end.range });
  check(ctx, begin_pats, { tag: "ty_pattern", range: begin_pats.range });
  check(ctx, end_pats, { tag: "ty_pattern", range: end_pats.range });
  check(ctx, patterns, { tag: "ty_pattern", range: patterns.range });
  const ty = { tag: "ty_pattern", range };
  return { tag: "surround", range, ty, scope, begin, begin_pats, end, end_pats, patterns };
};
var regex_integer = /^\d+$/;
var infer_expr = (ctx, syn) => {
  const { text, report } = ctx;
  const range = syntax_to_range(syn);
  switch (syn.tag) {
    case syntax.tag.atom: {
      const span = token.to_span(syn.leaf, text);
      if (regex_integer.test(span)) {
        const data = parseInt(span);
        const ty = { tag: "ty_regex", range };
        return { tag: "code_point", range, ty, data };
      } else {
        const ty = { tag: "hole", range };
        return { tag: "variable", range, ty, name: span };
      }
    }
    case syntax.tag.lone: {
      const err = { range, message: msg.syntax };
      report.push(err);
      return { tag: "hole", range };
    }
    case syntax.tag.mismatch:
    case syntax.tag.group: {
      if (syn.tag === syntax.tag.mismatch) {
        const err2 = { range, message: msg.syntax };
        report.push(err2);
      }
      const lst = syn.children.filter((x) => !is_skipable(x, text));
      const open = lst[0];
      const close = lst[lst.length - 1];
      if (open.leaf.kind === token.kind.quote.double && close.leaf.kind === token.kind.quote.double) {
        return infer_lstr(ctx, lst);
      }
      if (lst.length >= 3) {
        const lead = syntax_to_span(lst[1], text);
        switch (lead) {
          case "match":
            return infer_match(ctx, lst);
          case "concat":
            return infer_concat(ctx, lst);
          case "repeat":
            return infer_repeat(ctx, lst);
          case "choice":
            return infer_choice(ctx, lst);
          case "surround":
            return infer_surround(ctx, lst);
          case "negative":
            return infer_negative(ctx, lst);
          case "union":
            return infer_union(ctx, lst);
          default:
            break;
        }
      }
      const err = { message: msg.syntax, range };
      report.push(err);
      return { tag: "hole", range };
    }
  }
};
var infer_let = (ctx, lst) => {
  const { text, report } = ctx;
  const range = list.to_range(lst);
  const close = list.close(lst);
  let binder;
  if (lst.length >= 4) {
    binder = parse_identifier(ctx, lst[2]);
  } else {
    binder = { range: close, text: "_" };
  }
  let body;
  if (lst.length >= 5) {
    body = infer_expr(ctx, lst[3]);
  } else {
    body = { tag: "hole", range: close };
  }
  let actual;
  switch (body.tag) {
    case "hole": {
      actual = { tag: "hole", range };
      break;
    }
    default: {
      actual = body.ty;
      break;
    }
  }
  let constraint = ctx.toplevel.get(binder.text);
  if (constraint !== void 0) {
    constraint.actual = actual;
  } else {
    const expected = [];
    ctx.toplevel.set(binder.text, { actual, expected });
  }
  const ty = { tag: "ty_unit", range };
  return { tag: "binding", range, ty, binder, body };
};
var infer_grammar = (ctx, lst) => {
  const { text, report } = ctx;
  const range = list.to_range(lst);
  const close = list.close(lst);
  let ident;
  if (lst.length >= 4) {
    ident = parse_identifier(ctx, lst[2]);
  } else {
    ident = { range: close, text: "_" };
  }
  const actual = { tag: "ty_pattern", range };
  let constraint = ctx.toplevel.get(ident.text);
  if (constraint !== void 0) {
    constraint.actual = actual;
  } else {
    ctx.toplevel.set(ident.text, {
      actual,
      expected: []
    });
  }
  const ty = { tag: "ty_unit", range };
  return { tag: "grammar", range, ty, name: ident };
};
var infer_stmt = (ctx, syn) => {
  const { text, report } = ctx;
  const range = syntax_to_range(syn);
  switch (syn.tag) {
    case syntax.tag.atom:
    case syntax.tag.lone: {
      const err = { range, message: msg.syntax };
      report.push(err);
      return { tag: "hole", range };
    }
    case syntax.tag.mismatch:
    case syntax.tag.group: {
      if (syn.tag === syntax.tag.mismatch) {
        const err2 = { range, message: msg.syntax };
        report.push(err2);
      }
      const lst = syn.children.filter((x) => !is_skipable(x, text));
      if (lst.length >= 3) {
        const lead = syntax_to_span(lst[1], text);
        switch (lead) {
          case "grammar":
            return infer_grammar(ctx, lst);
          case "let":
            return infer_let(ctx, lst);
          default:
            break;
        }
      }
      const err = { message: msg.syntax, range };
      report.push(err);
      return { tag: "hole", range };
    }
  }
};
var check_mutual_recursion = (ctx) => {
  const { toplevel, report } = ctx;
  for (let [name, constraint] of toplevel) {
    for (let exp of constraint.expected) {
      if (constraint.actual === void 0) {
        report.push({ range: exp.range, message: msg.scope });
        break;
      }
      if (!unify(constraint.actual, exp)) {
        report.push({ range: exp.range, message: msg.typ });
      }
    }
  }
};
var check = (ctx, ex, ty) => {
  const { report } = ctx;
  switch (ex.tag) {
    case "hole":
      return;
    case "variable": {
      let constraint = ctx.toplevel.get(ex.name);
      if (constraint !== void 0) {
        constraint.expected.push(ty);
      } else {
        ctx.toplevel.set(ex.name, { actual: void 0, expected: [ty] });
      }
      return;
    }
    default: {
      let act = ex.ty;
      if (!unify(act, ty)) {
        const err = { range: ex.range, message: msg.typ };
        report.push(err);
      }
      return;
    }
  }
};
var infer_source = (ctx, lst) => {
  let tmp = lst.filter((x) => !is_skipable(x, ctx.text));
  let rslt = tmp.map((x) => infer_stmt(ctx, x));
  check_mutual_recursion(ctx);
  return rslt;
};

// diagnostic.ts
var vscode = __toESM(require("vscode"));
var import_vscode = require("vscode");
var import_vscode2 = require("vscode");
var error = {
  to_diagnostic: (self) => {
    let {
      range: { start, end },
      message
    } = self;
    const pstart = new import_vscode.Position(start.line, start.character);
    const pend = new import_vscode.Position(end.line, end.character);
    const range = new import_vscode.Range(pstart, pend);
    const rslt = new import_vscode.Diagnostic(range, message, import_vscode2.DiagnosticSeverity.Error);
    return rslt;
  }
};
var handler = (out, event, dia) => {
  const text = event.document.getText();
  const prs = parser.make(text);
  const sexp = parser.parse(prs);
  const ctx = {
    toplevel: /* @__PURE__ */ new Map(),
    report: [],
    text
  };
  infer_source(ctx, sexp);
  let items = ctx.report.map(error.to_diagnostic);
  dia.set(event.document.uri, items);
};
var register_diagnostic = (name) => vscode.languages.createDiagnosticCollection(name);
var manager = register_diagnostic("sexp");
var make = (out) => {
  return (e) => {
    if (e.contentChanges.length === 0) return;
    if (e.document.uri.scheme === "output" /* output */) return;
    if (e.document.languageId !== "textmate") return;
    handler(out, e, manager);
  };
};

// complete.ts
var vscode2 = require("vscode");
var import_vscode3 = require("vscode");
var is_typing = (tok, pos) => {
  return tok.line === pos.line && tok.character + tok.length === pos.character;
};
var typing_token = (sexp, pos) => {
  let dfs = (syn) => {
    switch (syn.tag) {
      case syntax.tag.atom:
      case syntax.tag.lone: {
        if (is_typing(syn.leaf, pos)) {
          return syn.leaf;
        }
        return void 0;
      }
      case syntax.tag.group:
      case syntax.tag.mismatch: {
        return dfs_many(syn.children);
      }
    }
  };
  let dfs_many = (syns) => {
    for (let tl of syns) {
      let val = dfs(tl);
      if (val !== void 0) {
        return val;
      }
    }
    return void 0;
  };
  return dfs_many(sexp);
};
var typing_span = (sexp, text, pos) => {
  let tok = typing_token(sexp, pos);
  return tok ? text.slice(tok.start, tok.end) : "";
};
var make2 = (out) => {
  return {
    provideCompletionItems: (doc, pos, _) => {
      const text = doc.getText();
      let prs = parser.make(text);
      let sexp = parser.parse(prs);
      let ctx = { toplevel: /* @__PURE__ */ new Map(), text, report: [] };
      let ast = infer_source(ctx, sexp);
      let ts = typing_span(sexp, text, pos);
      let rslt = [
        ...ctx.toplevel.keys().filter((x) => x != ts).map((x) => new import_vscode3.CompletionItem(x, import_vscode3.CompletionItemKind.Variable))
      ];
      return rslt;
    }
  };
};

// rename.ts
var vscode3 = __toESM(require("vscode"));
var is_selected = (tok, pos) => {
  const is_same_line = tok.line === pos.line;
  const is_pos_in_token = tok.character <= pos.character && pos.character <= tok.character + tok.length;
  return is_same_line && is_pos_in_token;
};
var renaming_token = (sexp, pos) => {
  const dfs = (syn) => {
    switch (syn.tag) {
      case syntax.tag.atom:
      case syntax.tag.lone: {
        if (is_selected(syn.leaf, pos)) {
          return syn.leaf;
        }
        return void 0;
      }
      case syntax.tag.group:
      case syntax.tag.mismatch: {
        return dfs_many(syn.children);
      }
    }
  };
  const dfs_many = (syns) => {
    for (let tl of syns) {
      let val = dfs(tl);
      if (val !== void 0) {
        return val;
      }
    }
    return void 0;
  };
  return dfs_many(sexp);
};
var renaming_span = (sexp, text, pos) => {
  const tok = renaming_token(sexp, pos);
  return tok ? text.slice(tok.start, tok.end) : "";
};
var collect_ranges = (stmts, old_text) => {
  let dst = [];
  let dfs_stmt = (stmt) => {
    switch (stmt.tag) {
      case "binding": {
        if (old_text === stmt.binder.text) {
          dst.push(stmt.binder.range);
        }
        dfs_expr(stmt.body);
        break;
      }
      case "grammar": {
        if (old_text === stmt.name.text) {
          dst.push(stmt.name.range);
        }
        break;
      }
      case "hole":
        break;
    }
  };
  let dfs_expr = (exp) => {
    switch (exp.tag) {
      case "variable": {
        if (old_text === exp.name) {
          dst.push(exp.range);
        }
        break;
      }
      case "union":
      case "choice":
      case "concat": {
        for (const child of exp.children) {
          dfs_expr(child);
        }
        break;
      }
      case "match":
      case "repeat":
      case "negative": {
        dfs_expr(exp.rex);
        break;
      }
      case "surround": {
        dfs_expr(exp.begin);
        dfs_expr(exp.end);
        dfs_expr(exp.begin_pats);
        dfs_expr(exp.end_pats);
        dfs_expr(exp.patterns);
      }
      case "lstr":
      case "code_point":
      case "hole":
        break;
    }
  };
  for (const stmt of stmts) {
    dfs_stmt(stmt);
  }
  return dst;
};
var make3 = (out) => {
  return {
    provideRenameEdits: (doc, pos, new_name, _) => {
      const text = doc.getText();
      const prs = parser.make(text);
      const sexp = parser.parse(prs);
      const old_name = renaming_span(sexp, text, pos);
      const ctx = {
        toplevel: /* @__PURE__ */ new Map(),
        report: [],
        text
      };
      const ast = infer_source(ctx, sexp);
      let ranges = collect_ranges(ast, old_name);
      let edit = new vscode3.WorkspaceEdit();
      for (const r of ranges) {
        const range = new vscode3.Range(
          new vscode3.Position(r.start.line, r.start.character),
          new vscode3.Position(r.end.line, r.end.character)
        );
        edit.replace(doc.uri, range, new_name);
      }
      return edit;
    }
  };
};

// extension.ts
var proc = __toESM(require("node:process"));

// emit.ts
var hyphen = 45;
var backslash = 92;
var double_quote = 34;
var single_quote = 39;
var backtick = 96;
var open_paren = 40;
var close_paren = 41;
var open_bracket = 91;
var close_bracket = 93;
var open_brace = 123;
var close_brace = 125;
var tilde = 126;
var exclamation = 33;
var at = 64;
var hash = 35;
var dollar = 36;
var percent = 37;
var caret = 94;
var ampersand = 38;
var asterisk = 42;
var equals = 61;
var plus = 43;
var slash = 47;
var pipe = 124;
var colon = 58;
var semicolon = 59;
var less_than = 60;
var greater_than = 62;
var question = 63;
var space = 32;
var tab = 9;
var form_feed = 12;
var num_0 = 48;
var num_1 = 49;
var num_2 = 50;
var num_3 = 51;
var num_4 = 52;
var num_5 = 53;
var num_6 = 54;
var num_7 = 55;
var num_8 = 56;
var num_9 = 57;
var concat = (lft, rht) => {
  return { tag: "concat", lft, rht };
};
var choice = (top, bot) => {
  return { tag: "choice", top, bot };
};
var repeat = (rex) => {
  return { tag: "repeat", rex };
};
var negative = (rex) => {
  return { tag: "negative", rex };
};
var code_point = (data) => {
  return { tag: "code_point", data };
};
var lstr = (data) => {
  return { tag: "lstr", data };
};
var escape_regex = (s) => {
  switch (s) {
    case "-":
      return "\\-";
    case "[":
      return "\\[";
    case "]":
      return "\\]";
    case "(":
      return "\\(";
    case ")":
      return "\\)";
    case "{":
      return "\\{";
    case "}":
      return "\\}";
    case "\\":
      return "\\\\";
    default:
      return s;
  }
};
var regex = {
  to_string: (self) => {
    switch (self.tag) {
      case "concat": {
        let lft = regex.to_string(self.lft);
        let rht = regex.to_string(self.rht);
        return `${lft}${rht}`;
      }
      case "choice": {
        let top = regex.to_string(self.top);
        let bot = regex.to_string(self.bot);
        return `${top}|${bot}`;
      }
      case "repeat": {
        let rex = regex.to_string(self.rex);
        return `(${rex})*`;
      }
      case "code_point": {
        let ch = String.fromCodePoint(self.data);
        return escape_regex(ch);
      }
      case "lstr":
        return self.data;
      case "negative": {
        let collect = (dst2, self2) => {
          switch (self2.tag) {
            case "concat":
            case "repeat":
            case "negative":
            case "lstr":
              throw new Error("emit error");
            case "choice": {
              collect(dst2, self2.top);
              collect(dst2, self2.bot);
              break;
            }
            case "code_point": {
              dst2.push(self2.data);
              break;
            }
          }
        };
        let dst = [];
        collect(dst, self.rex);
        let set = dst.map((x) => escape_regex(String.fromCodePoint(x))).join("");
        return `[^${set}]`;
      }
    }
  }
};
var pattern = {
  to_json: (self) => {
    switch (self.tag) {
      case "match":
        return {
          name: self.scope,
          match: regex.to_string(self.rex)
        };
      case "variable":
        return {
          include: `#${self.name}`
        };
      case "surround": {
        return {
          name: self.scope,
          begin: regex.to_string(self.begin),
          beginCaptures: {
            [0]: {
              patterns: self.begin_pats.map(pattern.to_json)
            }
          },
          endCaptures: {
            [0]: {
              patterns: self.end_pats.map(pattern.to_json)
            }
          },
          end: regex.to_string(self.end),
          patterns: self.patterns.map(pattern.to_json)
        };
      }
    }
  }
};
var binding = {
  to_json: (self) => {
    return {
      [self.binder]: {
        patterns: self.patterns.map(pattern.to_json)
      }
    };
  }
};
var grammar = {
  to_json: (self) => {
    const patterns = [{ include: `#${self.name}` }];
    const $schema = "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json";
    const scopeName = `source.${self.name}`;
    const name = self.name;
    let pats = self.bindings.map((x) => {
      return { include: `#${x.binder}` };
    });
    const grammar2 = { [self.name]: { patterns: pats } };
    const repository = self.bindings.reduce(
      (acc, x) => Object.assign(acc, binding.to_json(x)),
      grammar2
    );
    return {
      $schema,
      name,
      scopeName,
      patterns,
      repository
    };
  }
};
var keywords = {
  binder: "keywords",
  patterns: [
    {
      tag: "match",
      scope: "keyword.other",
      rex: choice(choice(lstr("let"), lstr("nominal")), lstr("module"))
    },
    {
      tag: "match",
      scope: "keyword.other.type",
      rex: choice(
        choice(lstr("pi"), lstr("sigma")),
        choice(lstr("inductive"), lstr("type"))
      )
    },
    {
      tag: "match",
      scope: "keyword.other.expr",
      rex: choice(choice(lstr("lambda"), lstr("record")), lstr("ffi"))
    },
    {
      tag: "match",
      scope: "variable.other.constant",
      rex: choice(lstr("true"), lstr("false"))
    },
    {
      tag: "match",
      scope: "keyword.comment.unobtrusive",
      rex: lstr("comment")
    },
    {
      tag: "match",
      scope: "keyword.control",
      rex: choice(
        choice(lstr("match"), lstr("if")),
        choice(lstr("loop"), choice(lstr("break"), lstr("continue")))
      )
    },
    {
      tag: "match",
      scope: "keyword.control.unobtrusive",
      rex: lstr("scope")
    }
  ]
};
var punct = [hyphen, backslash, double_quote, single_quote, backtick, open_paren, close_paren, open_bracket, close_bracket, open_brace, close_brace, tilde, exclamation, at, hash, dollar, percent, caret, ampersand, asterisk, equals, plus, slash, pipe, colon, semicolon, less_than, greater_than, question, tab, form_feed];
var identifier = {
  binder: "identifier",
  patterns: [
    {
      tag: "match",
      scope: "variable.name",
      rex: negative(
        punct.reduce(
          (acc, x) => choice(acc, code_point(x)),
          code_point(space)
        )
      )
    }
  ]
};
var brackets = {
  binder: "delimiter.unobtrusive",
  patterns: [
    {
      tag: "match",
      scope: "unobtrusive",
      rex: choice(
        choice(
          choice(code_point(open_paren), code_point(close_paren)),
          choice(code_point(open_brace), code_point(close_brace))
        ),
        choice(code_point(open_bracket), code_point(close_bracket))
      )
    }
  ]
};
var interpolation = {
  binder: "interpolation",
  patterns: [
    {
      tag: "surround",
      scope: "",
      begin: code_point(open_brace),
      end: code_point(close_brace),
      begin_pats: [{ tag: "variable", name: "delimiter.unobtrusive" }],
      end_pats: [{ tag: "variable", name: "delimiter.unobtrusive" }],
      patterns: [{ tag: "variable", name: "sexp" }]
    }
  ]
};
var string = {
  binder: "string",
  patterns: [
    {
      tag: "surround",
      scope: "string.interpolated",
      begin: code_point(double_quote),
      end: code_point(double_quote),
      begin_pats: [],
      end_pats: [],
      patterns: [{ tag: "variable", name: "interpolation" }]
    }
  ]
};
var digit = [num_1, num_2, num_3, num_4, num_5, num_6, num_7, num_8, num_9].reduce((acc, x) => choice(acc, code_point(x)), code_point(num_0));
var integer = {
  binder: "integer",
  patterns: [
    {
      tag: "match",
      scope: "constant.numeric",
      rex: concat(digit, repeat(digit))
    }
  ]
};

// lower.ts
var EmitError = class extends Error {
};
var lower_expr_to_regex = (env, self) => {
  switch (self.tag) {
    case "concat": {
      const { children } = self;
      let len = children.length;
      if (len === 0) {
        return { tag: "lstr", data: "" };
      } else if (len === 1) {
        return lower_expr_to_regex(env, children[0]);
      } else {
        let acc = lower_expr_to_regex(env, children[0]);
        for (let i = 1; i < len; i++) {
          const rht = lower_expr_to_regex(env, children[i]);
          acc = { tag: "concat", lft: acc, rht };
        }
        return acc;
      }
    }
    case "choice": {
      const { children } = self;
      let len = children.length;
      if (len === 0) {
        return { tag: "lstr", data: "" };
      } else if (len === 1) {
        return lower_expr_to_regex(env, children[0]);
      } else {
        let acc = lower_expr_to_regex(env, children[0]);
        for (let i = 1; i < len; i++) {
          const top = lower_expr_to_regex(env, children[i]);
          acc = { tag: "choice", bot: acc, top };
        }
        return acc;
      }
    }
    case "repeat": {
      let rex = lower_expr_to_regex(env, self.rex);
      return { tag: "repeat", rex };
    }
    case "negative": {
      let rex = lower_expr_to_regex(env, self.rex);
      return { tag: "negative", rex };
    }
    case "code_point": {
      return { tag: "code_point", data: self.data };
    }
    case "lstr": {
      return { tag: "lstr", data: self.data };
    }
    case "variable": {
      let val = env.get(self.name);
      if (val === void 0) throw new EmitError();
      return val;
    }
    case "union":
    case "match":
    case "surround":
    case "hole":
      throw new EmitError();
  }
};
var lower_expr_to_patterns = (env, self) => {
  switch (self.tag) {
    case "union": {
      return self.children.flatMap((child) => lower_expr_to_patterns(env, child));
    }
    case "variable": {
      return [{ tag: "variable", name: self.name }];
    }
    case "match": {
      const scope = self.scope.text;
      const rex = lower_expr_to_regex(env, self.rex);
      return [{ tag: "match", scope, rex }];
    }
    case "surround": {
      const scope = self.scope.text;
      const begin = lower_expr_to_regex(env, self.begin);
      const begin_pats = lower_expr_to_patterns(env, self.begin_pats);
      const end = lower_expr_to_regex(env, self.end);
      const end_pats = lower_expr_to_patterns(env, self.end_pats);
      const patterns = lower_expr_to_patterns(env, self.patterns);
      return [{ tag: "surround", scope, begin, begin_pats, end, end_pats, patterns }];
    }
    case "concat":
    case "choice":
    case "repeat":
    case "negative":
    case "code_point":
    case "lstr":
    case "hole": {
      throw new EmitError();
    }
  }
};
var lower_source = (env, ast) => {
  let name = "";
  let bindings = [];
  for (let stmt of ast) {
    switch (stmt.tag) {
      case "binding": {
        let binder = stmt.binder.text;
        switch (stmt.body.tag) {
          case "hole":
            throw new EmitError();
          default: {
            switch (stmt.body.ty.tag) {
              case "ty_regex": {
                let rex = lower_expr_to_regex(env, stmt.body);
                env.set(stmt.binder.text, rex);
                break;
              }
              case "ty_pattern": {
                let patterns = lower_expr_to_patterns(env, stmt.body);
                bindings.push({ binder, patterns });
                break;
              }
              case "hole":
              case "ty_unit":
                throw new EmitError();
            }
          }
        }
        break;
      }
      case "grammar": {
        name = stmt.name.text;
        break;
      }
      case "hole": {
        break;
      }
    }
  }
  return { name, bindings };
};
var lower = (ast) => {
  let env = /* @__PURE__ */ new Map();
  return lower_source(env, ast);
};

// action.ts
var vscode4 = __toESM(require("vscode"));
var path = __toESM(require("node:path"));
var import_vscode4 = require("vscode");
var code_emission = (doc) => {
  let text = doc.getText();
  let prs = parser.make(text);
  let sexp = parser.parse(prs);
  const ctx = { report: [], text, toplevel: /* @__PURE__ */ new Map() };
  let ast = infer_source(ctx, sexp);
  let lir = lower(ast);
  let json = grammar.to_json(lir);
  let act = new import_vscode4.CodeAction("emit", import_vscode4.CodeActionKind.Empty);
  let target = path.join(
    path.dirname(doc.uri.fsPath),
    `${path.basename(doc.uri.fsPath, "tm")}json`
  );
  let edit = new vscode4.WorkspaceEdit();
  edit.createFile(vscode4.Uri.file(target), { overwrite: true });
  console.log(json);
  edit.insert(
    vscode4.Uri.file(target),
    new vscode4.Position(0, 0),
    JSON.stringify(json)
  );
  act.edit = edit;
  return act;
};
var make4 = (out) => {
  return {
    provideCodeActions: (doc, range, cctx, _) => {
      return [code_emission(doc)];
    }
  };
};

// extension.ts
var activate = (context) => {
  console.log(proc.cwd());
  const lang_id = "textmate";
  const out = vscode5.window.createOutputChannel(lang_id, "log");
  const cmpl = vscode5.languages.registerCompletionItemProvider(
    lang_id,
    make2(out)
  );
  const diag = vscode5.workspace.onDidChangeTextDocument(make(out));
  const rn = vscode5.languages.registerRenameProvider(lang_id, make3(out));
  const act = vscode5.languages.registerCodeActionsProvider(
    lang_id,
    make4(out)
  );
  context.subscriptions.push(cmpl, diag, rn, act, out);
};
var deactivate = () => {
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
