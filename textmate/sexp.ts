export { syntax , token , lexer, parser }
export type { position, range }


class impossible extends Error {}

type u32 = number;
type array<a> = a[];
type str = string;
type code_unit = number;
type unit = undefined;

const str = {
  code_unit_at: (s: str, i: u32): code_unit => {
    return s.charCodeAt(i);
  },
  repeat: (n: u32, s: str): str => {
    return s.repeat(n);
  },
};

const array = {
  truncate: <a>(xs: array<a>, s: u32): unit => {
    return (xs.length = s as any);
  },
  flatten: <a>(xs: array<array<a>>): array<a> => {
    return xs.flat();
  },
  drain: <a>(xs: array<a>, s: u32, e: u32): array<a> => {
    return xs.splice(s, e - s);
  },
  join: (xs: array<str>, sep: str): str => {
    return xs.join(sep);
  },
  map: <a, b>(xs: array<a>, f: (x: a) => b): array<b> => {
    return xs.map(f);
  },
  mapi: <a, b>(xs: array<a>, f: (i: u32, x: a) => b): array<b> => {
    return xs.map((x, i) => f(i, x));
  },
  copy_nonoverlapping: <a>(
    src: array<a>,
    sofs: u32,
    dst: array<a>,
    dofs: u32,
    len: u32,
  ): unit => {
    for (let i = sofs, j = dofs; j < dofs + len; i++, j++) {
      dst[j] = src[i];
    }
  },
};
type debug<a> = { debug: (self: a) => str };

type position = { line: u32; character: u32 };
type range = { start: position; end: position };

const EOL = "\n";

// prettier-ignore
const parenthesis : { readonly left : 1, readonly right : 2, } = { left : 1, right : 2 }
// prettier-ignore
const curly_bracket : { readonly left : 3, readonly right : 4, } = { left : 3, right : 4 }
// prettier-ignore
const square_bracket : { readonly left : 5, readonly right : 6, } = { left : 5, right : 6 }
// prettier-ignore
const quote: { readonly single: 7; readonly double: 8; readonly back: 9; } = { single: 7, double: 8, back: 9, };
// prettier-ignore
const atom: { readonly identifier: 10; readonly space: 11; } = { identifier: 10, space: 11, };

const padding = 0;

namespace token {
  export type kind =
    | typeof quote.single
    | typeof quote.double
    | typeof quote.back
    | typeof parenthesis.left
    | typeof parenthesis.right
    | typeof curly_bracket.left
    | typeof curly_bracket.right
    | typeof square_bracket.left
    | typeof square_bracket.right
    | typeof atom.identifier
    | typeof atom.space;
}

const kind: debug<token.kind> & {
  readonly atom: typeof atom;
  readonly quote: typeof quote;
  readonly square_bracket: typeof square_bracket;
  readonly curly_bracket: typeof curly_bracket;
  readonly parenthesis: typeof parenthesis;
} = {
  atom,
  quote,
  square_bracket,
  curly_bracket,
  parenthesis,
  debug: x => {
    // prettier-ignore
    switch (x) {
      case parenthesis.left:  return "parenthesis.left";
      case parenthesis.right:  return "parenthesis.right";
      case curly_bracket.left:  return "curly_bracket.left";
      case curly_bracket.right:  return "curly_bracket.right";
      case square_bracket.left:  return "square_bracket.left";
      case square_bracket.right:  return "square_bracket.right";
      case quote.single: return "quote.single"
      case quote.double:  return "quote.double";
      case quote.back: return "quote.back";
      case atom.identifier:  return "atom.identifier";
      case atom.space:  return "atom.space";
      default: throw new impossible;
    }
  },
};

type token = {
  readonly kind: token.kind;
  /** line number (0-based). */
  readonly line: u32;
  /** character offset on line in document (0-based), measured in UTF-16 code unit. */
  readonly character: u32;
  /** length measured in UTF-16 code unit. */
  readonly length: u32;
  /** start offset in document, **inclusive** (0-based), measured in UTF-16 code unit. */
  readonly start: u32;
  /** end offset in document, **exclusive** (0-based), measured in UTF-16 code unit. */
  readonly end: u32;
};

const token: debug<token> & {
  readonly kind: typeof kind;
  readonly to_start_position: (self: token) => position;
  readonly to_end_position: (self: token) => position;
  readonly to_span: (self: token, text: string) => string;
  readonly to_range: (self: token) => range;
} = {
  debug: (x: token) => {
    return `{ kind: ${kind.debug(x.kind)}, line: ${x.line}, character: ${x.character}, length: ${x.length}, start: ${x.start}, end: ${x.end} }`;
  },
  to_start_position: self => {
    return {
      line: self.line,
      character: self.character,
    };
  },
  to_end_position: self => {
    return {
      line: self.line,
      character: self.character + self.length,
    };
  },
  to_span: (self, text) => {
    return text.slice(self.start, self.end);
  },
  to_range: self => {
    let start = token.to_start_position(self);
    let end = token.to_end_position(self);
    const range = { start, end };
    return range;
  },
  kind,
};

/** Unicode code point 32-bit unsigned integer */
type code_point = number;

const delimiter = {
  parenthesis: {
    /** `(` */
    left: 40,
    /** `)` */
    right: 41,
  },
  square_bracket: {
    /** `[` */
    left: 91,
    /** `]` */
    right: 93,
  },
  curly_bracket: {
    /** `{` */
    left: 123,
    /** `}` */
    right: 125,
  },
  quote: {
    /** `'` */
    single: 39,
    /** `"` */
    double: 34,
    /** `` ` `` */
    back: 96,
  },
};

/** https://www.unicode.org/charts/nameslist/n_0000.html */
const control = {
  tabulation: {
    /** horizontal tabulation (HT) */
    horizontal: 0x0009,
    /** vertical tabulation (VT) */
    vertical: 0x000b,
  },
  /** line feed (LF) */
  line_feed: 0x000a,
};
const whitespace = {
  space: 0x0020,
};
// const whitespace

const is_delimiter = (cp: code_point) => {
  switch (cp) {
    case delimiter.parenthesis.left:
    case delimiter.parenthesis.right:
    case delimiter.square_bracket.left:
    case delimiter.square_bracket.right:
    case delimiter.curly_bracket.left:
    case delimiter.curly_bracket.right:
    case delimiter.quote.single:
    case delimiter.quote.double:
    case delimiter.quote.back:
      return true;
    default:
      return false;
  }
};

type lexer = {
  text: string;
  line: u32;
  character: u32;
  start: u32;
};

const lexer: {
  readonly make: (text: string) => lexer;
  readonly next: (self: lexer) => token | undefined;
} = {
  make: text => {
    return { text, line: 0, character: 0, start: 0 };
  },
  next: self => {
    const pch = self.character;
    const pln = self.line;
    const pst = self.start;

    let ch = pch;
    let ln = pln;
    let st = pst;
    let len = 0;
    if (st < self.text.length) {
      let cu = str.code_unit_at(self.text, st);
      let kind: token.kind;
      // prettier-ignore
      switch (cu) {
        case delimiter.parenthesis.left: st++; ch++; len++; kind = parenthesis.left; break;
        case delimiter.parenthesis.right: st++; ch++; len++; kind = parenthesis.right; break;
        case delimiter.square_bracket.left: st++; ch++; len++; kind = square_bracket.left; break;
        case delimiter.square_bracket.right: st++; ch++; len++;  kind = square_bracket.right; break;
        case delimiter.curly_bracket.left: st++; ch++; len++; kind = curly_bracket.left; break;
        case delimiter.curly_bracket.right: st++; ch++; len++; kind = curly_bracket.right; break;
        case delimiter.quote.single: st++; ch++; len++; kind = quote.single; break;
        case delimiter.quote.double: st++; ch++; len++; kind = quote.double; break;
        case delimiter.quote.back: st++; ch++; len++; kind = quote.back; break;
        case control.line_feed: 
          st++; ch = 0; len++; ln++;
          loop: while (st < self.text.length) {
            let cu = str.code_unit_at(self.text, st);
            switch (cu) {
              case control.line_feed: st++; ch = 0; len++; ln++; continue loop;
              case control.tabulation.horizontal: case control.tabulation.vertical: case whitespace.space:
                st++; ch++; len++; continue loop;
              default: break loop;
            }
          }
          kind = atom.space
          break;  
        case control.tabulation.horizontal: case control.tabulation.vertical: case whitespace.space:
          st++; ch++; len++;
          loop: while (st < self.text.length) {
            let cu = str.code_unit_at(self.text, st);
            switch (cu) {
              case control.line_feed: st++; ch = 0; len++; ln++; continue loop;
              case control.tabulation.horizontal: case control.tabulation.vertical: case whitespace.space:
                st++; ch++; len++; continue loop;
              default: break loop;
            }
          }
          kind = atom.space
          break;
        default:
          st++; ch++; len++;
          loop: while (st < self.text.length) {
            let cu = str.code_unit_at(self.text, st);
            switch (cu) {
              case delimiter.parenthesis.left: case delimiter.parenthesis.right: case delimiter.square_bracket.left: case delimiter.square_bracket.right: case delimiter.curly_bracket.left: case delimiter.curly_bracket.right: case delimiter.quote.single: case delimiter.quote.double: case delimiter.quote.back:
              case control.line_feed: case control.tabulation.horizontal: case control.tabulation.vertical: case whitespace.space:
                break loop;  
              default: st++; ch++; len++; continue loop;
            }
          }
          kind = atom.identifier
          break;
      }
      self.start = st;
      self.character = ch;
      self.line = ln;
      // prettier-ignore
      let tok: token = { kind, line: pln, character: pch, length: len, start: pst, end: st, };
      return tok;
    } else {
      return undefined;
    }
  },
};

const tokenize = (text: string): token[] => {
  let lex = lexer.make(text);
  let rslt: token[] = [];
  loop: while (true) {
    let tok = lexer.next(lex);
    if (tok !== undefined) {
      rslt.push(tok);
      continue loop;
    } else {
      break loop;
    }
  }
  return rslt;
};

type syntax = syntax.atom | syntax.lone | syntax.group | syntax.mismatch;
export namespace syntax {
  export type atom = { tag: typeof tag.atom; leaf: token };
  export type lone = { tag: typeof tag.lone; leaf: token };
  export type group = { tag: typeof tag.group; children: syntax[] };
  export type mismatch = { tag: typeof tag.mismatch; children: syntax[] };
  export type tag = {
    readonly atom: 1;
    readonly lone: 2;
    readonly group: 3;
    readonly mismatch: 4;
  };
}
const tag: syntax.tag = { atom: 1, lone: 2, group: 3, mismatch: 4 };

const skeleton: debug<syntax> = {
  debug: self => {
    // prettier-ignore
    switch (self.tag) {
      case tag.atom: case tag.lone: {
        return token.kind.debug(self.leaf.kind);
      } 
      case tag.group: case tag.mismatch : {
        return `(${self.children.map(skeleton.debug).join(" ")})`
      } 
    }
  },
};

const syntax: {
  readonly group: (children: syntax[]) => syntax.group;
  readonly mismatch: (children: syntax[]) => syntax.mismatch;
  readonly atom: (leaf: token) => syntax.atom;
  readonly lone: (leaf: token) => syntax.lone;
  readonly open: (self: syntax.group | syntax.mismatch) => token;
  readonly close: (self: syntax.group | syntax.mismatch) => token;
  readonly tag: typeof tag;
  readonly skeleton: typeof skeleton;
} & debug<syntax> = {
  // prettier-ignore
  group: (children) => { return { tag: tag.group, children }; },
  // prettier-ignore
  mismatch: (children) => { return { tag: tag.mismatch, children }; },
  // prettier-ignore
  atom: (leaf) => { return { tag: tag.atom, leaf }; },
  // prettier-ignore
  lone: (leaf) => { return { tag: tag.lone, leaf }; },
  debug: self => {
    // prettier-ignore
    switch (self.tag) {
      case tag.atom: case tag.lone: {
        return token.debug(self.leaf);
      } 
      case tag.group: case tag.mismatch : {
        return `{ ${self.children.map(syntax.debug).join(",")} }`
      } 
    }
  },
  // prettier-ignore
  open: (self) => { return (self.children[0] as syntax.atom).leaf; },
  // prettier-ignore
  close: (self) => { return (self.children[self.children.length - 1] as syntax.atom).leaf; },
  tag,
  skeleton,
};

type frame = {
  start: u32;
  token: token;
};

type parser = {
  lexer: lexer;
  pending: syntax[];
  stack: frame[];
};

const parser: {
  readonly make: (text: string) => parser;
  readonly matching: (self: parser, open: frame, token: token) => void;
  readonly advance: (self: parser, token: token) => void;
  readonly reduce: (self: parser, open: frame, token: token) => syntax[];
  readonly nest: (self: parser, token: token) => void;
  readonly shift: (self: parser, token: token) => void;
  readonly retain: (self: parser, token: token) => void;
  readonly parse: (self: parser) => syntax[];
} = {
  make: text => {
    return {
      lexer: lexer.make(text),
      pending: [],
      stack: [],
    };
  },
  matching: (self, frame, token) => {
    // prettier-ignore
    switch (frame.token.kind) {
      // atom | right 
      case atom.space: case atom.identifier: case parenthesis.right: case square_bracket.right: case curly_bracket.right: throw new impossible;

      case parenthesis.left:
        switch (token.kind) {
          // matching
          case parenthesis.right: {
              let syn = syntax.group(parser.reduce(self, frame, token));
              self.pending.push(syn);
          } break;
          // mismatch
          case curly_bracket.right: case square_bracket.right: {
              let syn = syntax.mismatch(parser.reduce(self, frame, token));
              self.pending.push(syn);
          } break;
          // (left,atom)
          case atom.space: case atom.identifier: {
            self.stack.push(frame);
            parser.shift(self,token);
          } break;
          // (left, quote | left)
          case parenthesis.left: case square_bracket.left: case curly_bracket.left:
          case quote.single: case quote.double: case quote.back: {
            self.stack.push(frame);
            parser.nest(self,token);
          } break;
          default: throw new impossible;
        } break;
      case square_bracket.left:
        switch (token.kind) {
          // matching
          case square_bracket.right: {
              let syn = syntax.group(parser.reduce(self, frame, token));
              self.pending.push(syn);
          } break;
          // mismatch
          case parenthesis.right: case curly_bracket.right: {
            let syn = syntax.mismatch(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // (left,atom)
          case atom.space: case atom.identifier: {
            self.stack.push(frame);
            parser.shift(self,token);
          } break;
          // (left, quote | left)
          case parenthesis.left: case square_bracket.left: case curly_bracket.left:
          case quote.single: case quote.double: case quote.back: {
            self.stack.push(frame);
            parser.nest(self,token);
          } break;
          default: throw new impossible;
        } break;
      case curly_bracket.left:
        switch (token.kind) {
          // matching
          case curly_bracket.right: {
              let syn = syntax.group(parser.reduce(self, frame, token));
              self.pending.push(syn);
          } break;
          // mismatch
          case parenthesis.right: case square_bracket.right: {
            let syn = syntax.mismatch(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // (left,atom)
          case atom.space: case atom.identifier: {
            self.stack.push(frame);
            parser.shift(self,token);
          } break;
          // (left, quote | left)
          case parenthesis.left: case square_bracket.left: case curly_bracket.left:
          case quote.single: case quote.double: case quote.back: {
            self.stack.push(frame);
            parser.nest(self,token);
          } break;
          default: throw new impossible;
        } break;
      case quote.back: {
        switch (token.kind) {
          // matching
          case quote.back: {
            let syn = syntax.group(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // mismatch
          case quote.single: case quote.double: {
            let syn = syntax.mismatch(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // (quote,right)
          case parenthesis.right: case square_bracket.right: case curly_bracket.right: {
            self.stack.push(frame);
            parser.retain(self,token);
          } break;
          // (quote,left)
          case parenthesis.left: case square_bracket.left: case curly_bracket.left: {
            self.stack.push(frame);
            parser.nest(self,token);
          } break;
          // (quote,atom)
          case atom.space: case atom.identifier: {
            self.stack.push(frame);
            parser.shift(self,token);
          } break;
          default: throw new impossible;
        }
      } break;
      case quote.single: {
        switch (token.kind) {
          // matching
          case quote.single: {
            let syn = syntax.group(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // mismatch
          case quote.back: case quote.double: {
            let syn = syntax.mismatch(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // (quote,right)
          case parenthesis.right: case square_bracket.right: case curly_bracket.right: {
            self.stack.push(frame);
            parser.retain(self,token);
          } break;
          // (quote,left)
          case parenthesis.left: case square_bracket.left: case curly_bracket.left: {
            self.stack.push(frame);
            parser.nest(self,token);
          } break;
          // (quote,atom)
          case atom.space: case atom.identifier: {
            self.stack.push(frame);
            parser.shift(self,token);
          } break;
          default: throw new impossible;
        }
      } break;
      case quote.double: {
        switch (token.kind) {
          // matching
          case quote.double: {
            let syn = syntax.group(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // mismatch
          case quote.back: case quote.single: {
            let syn = syntax.mismatch(parser.reduce(self, frame, token));
            self.pending.push(syn);
          } break;
          // (quote,right)
          case parenthesis.right: case square_bracket.right: case curly_bracket.right: {
            self.stack.push(frame);
            parser.retain(self,token);
          } break;
          // (quote,left)
          case parenthesis.left: case square_bracket.left: case curly_bracket.left: {
            self.stack.push(frame);
            parser.nest(self,token);
          } break;
          // (quote,atom)
          case atom.space: case atom.identifier: {
            self.stack.push(frame);
            parser.shift(self,token);
          } break;
          default: throw new impossible;
        }
      } break;
      default: throw new impossible;
    }
  },
  advance: (self, tok) => {
    // prettier-ignore
    switch (tok.kind) {
      case parenthesis.left: case square_bracket.left: case curly_bracket.left:
      case quote.single: case quote.double: case quote.back: 
        parser.nest(self,tok); return;
      case atom.space: case atom.identifier:  
        parser.shift(self,tok); return;      
      case parenthesis.right: case square_bracket.right: case curly_bracket.right: 
        parser.retain(self,tok); return;
    }
  },
  reduce: (self, frame, tok) => {
    let rslt: syntax[] = new Array(2 + self.pending.length - frame.start);
    let open = syntax.atom(frame.token);
    rslt[0] = open;

    for (let i = frame.start, j = 1; i < self.pending.length; i++, j++) {
      rslt[j] = self.pending[i]!;
    }
    array.truncate(self.pending, frame.start);
    let close = syntax.atom(tok);
    rslt[rslt.length - 1] = close;
    return rslt;
  },
  nest: (self, token) => {
    let open: frame = { start: self.pending.length, token: token };
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
  parse: self => {
    loop: while (true) {
      let tok = lexer.next(self.lexer);
      if (tok !== undefined) {
        let open = self.stack.pop();
        if (open !== undefined) {
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
      let dst: syntax[] = new Array(self.pending.length + self.stack.length);
      let src = self.pending;
      let i = 0;
      let j = 0;
      let prev = 0;
      for (const frame of self.stack) {
        let len = frame.start - prev;
        let val = syntax.lone(frame.token);
        array.copy_nonoverlapping(src, i, dst, j, len);
        i += len;
        j += len;
        dst[j] = val;
        j++;
        prev = frame.start;
      }
      let len = src.length - i;
      array.copy_nonoverlapping(src, i, dst, j, len);
      return dst;
    }
  },
};
