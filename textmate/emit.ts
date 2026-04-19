export type { regex, concat, choice, repeat, negative, code_point, lstr };
export type { pattern, match, variable, surround };
export type {  binding };

export { grammar }

const hyphen: number = 45;
const backslash: number = 92;
const double_quote: number = 34;
const single_quote: number = 39;
const backtick: number = 96;
const open_paren: number = 40;
const close_paren: number = 41;
const open_bracket: number = 91;
const close_bracket: number = 93;
const open_brace: number = 123;
const close_brace: number = 125;
const tilde: number = 126;
const exclamation: number = 33;
const at: number = 64;
const hash: number = 35;
const dollar: number = 36;
const percent: number = 37;
const caret: number = 94;
const ampersand: number = 38;
const asterisk: number = 42;
const equals: number = 61;
const plus: number = 43;
const slash: number = 47;
const pipe: number = 124;
const colon: number = 58;
const semicolon: number = 59;
const less_than: number = 60;
const greater_than: number = 62;
const question: number = 63;
const space: number = 32;
const tab: number = 9;
const form_feed: number = 12;

const num_0: number = 48;
const num_1: number = 49;
const num_2: number = 50;
const num_3: number = 51;
const num_4: number = 52;
const num_5: number = 53;
const num_6: number = 54;
const num_7: number = 55;
const num_8: number = 56;
const num_9: number = 57;

type regex = concat | choice | repeat | negative | code_point | lstr;
type concat = { tag: "concat"; lft: regex; rht: regex };
type choice = { tag: "choice"; top: regex; bot: regex };
type repeat = { tag: "repeat"; rex: regex };
type negative = { tag: "negative"; rex: regex };
type code_point = { tag: "code_point"; data: number };
type lstr = { tag: "lstr"; data: string };

// prettier-ignore
const concat = (lft: regex, rht: regex): concat => { return { tag: "concat", lft, rht }; };
// prettier-ignore
const choice = (top: regex, bot: regex): choice => { return { tag: "choice", top, bot }; };
// prettier-ignore
const repeat = (rex: regex): repeat => { return { tag: "repeat", rex }; };
// prettier-ignore
const negative = (rex: regex): negative => { return { tag: "negative", rex }; };
// prettier-ignore
const code_point = (data: number): code_point => { return { tag: "code_point", data }; };
// prettier-ignore
const lstr = (data: string): lstr => { return { tag: "lstr", data }; };

// prettier-ignore
let escape_regex = (s: string): string => {
  switch (s) {
    case "-": return "\\-";
    case "[": return "\\[";
    case "]": return "\\]";
    case "(": return "\\(";
    case ")": return "\\)";
    case "{": return "\\{";
    case "}": return "\\}";
    case "\\": return "\\\\";
    default: return s;
  }
};

const regex: {
  readonly to_string: (self: regex) => string;
} = {
  to_string: self => {
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
        let collect = (dst: number[], self: regex): void => {
          // prettier-ignore
          switch (self.tag) {
            case "concat": case "repeat": case "negative": case "lstr": throw new Error("emit error");
            case "choice": { collect(dst, self.top); collect(dst, self.bot); break; }
            case "code_point": { dst.push(self.data); break; }
          }
        };

        let dst: number[] = [];
        collect(dst, self.rex);
        let set = dst.map(x => escape_regex(String.fromCodePoint(x))).join("");
        return `[^${set}]`;
      }
    }
  },
};

type match = { tag: "match"; scope: string; rex: regex };

type variable = { tag: "variable"; name: string };

type surround = {
  tag: "surround";
  scope: string;
  begin: regex;
  begin_pats: pattern[];
  end: regex;
  end_pats: pattern[];
  patterns: pattern[];
};

type pattern = match | variable | surround;

const pattern: {
  readonly to_json: (self: pattern) => object;
} = {
  to_json: self => {
    switch (self.tag) {
      case "match":
        return {
          name: self.scope,
          match: regex.to_string(self.rex),
        };
      case "variable":
        return {
          include: `#${self.name}`,
        };
      case "surround": {
        return {
          name: self.scope,
          begin: regex.to_string(self.begin),
          beginCaptures: {
            [0]: {
              patterns: self.begin_pats.map(pattern.to_json),
            },
          },
          endCaptures: {
            [0]: {
              patterns: self.end_pats.map(pattern.to_json),
            },
          },
          end: regex.to_string(self.end),
          patterns: self.patterns.map(pattern.to_json),
        };
      }
    }
  },
};

type binding = {
  binder: string;
  patterns: pattern[];
};

const binding: {
  readonly to_json: (self: binding) => object;
} = {
  to_json: self => {
    return {
      [self.binder]: {
        patterns: self.patterns.map(pattern.to_json),
      },
    };
  },
};

type grammar = {
  name: string;
  bindings: binding[];
};

const grammar: {
  readonly to_json: (self: grammar) => object;
} = {
  to_json: self => {
    const patterns = [{ include: `#${self.name}` }];
    const $schema =
      "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json";
    const scopeName = `source.${self.name}`;
    const name = self.name;

    let pats = self.bindings.map(x => {
      return { include: `#${x.binder}` };
    });
    const grammar = { [self.name]: { patterns: pats } };
    const repository: object = self.bindings.reduce(
      (acc, x) => Object.assign(acc, binding.to_json(x)),
      grammar,
    );
    return {
      $schema,
      name,
      scopeName,
      patterns,
      repository,
    };
  },
};

const keywords: binding = {
  binder: "keywords",
  patterns: [
    {
      tag: "match",
      scope: "keyword.other",
      rex: choice(choice(lstr("let"), lstr("nominal")), lstr("module")),
    },
    {
      tag: "match",
      scope: "keyword.other.type",
      rex: choice(
        choice(lstr("pi"), lstr("sigma")),
        choice(lstr("inductive"), lstr("type")),
      ),
    },
    {
      tag: "match",
      scope: "keyword.other.expr",
      rex: choice(choice(lstr("lambda"), lstr("record")), lstr("ffi")),
    },
    {
      tag: "match",
      scope: "variable.other.constant",
      rex: choice(lstr("true"), lstr("false")),
    },
    {
      tag: "match",
      scope: "keyword.comment.unobtrusive",
      rex: lstr("comment"),
    },
    {
      tag: "match",
      scope: "keyword.control",
      rex: choice(
        choice(lstr("match"), lstr("if")),
        choice(lstr("loop"), choice(lstr("break"), lstr("continue"))),
      ),
    },
    {
      tag: "match",
      scope: "keyword.control.unobtrusive",
      rex: lstr("scope"),
    },
  ],
};

// prettier-ignore
const punct = [ hyphen, backslash, double_quote, single_quote, backtick, open_paren, close_paren, open_bracket, close_bracket, open_brace, close_brace, tilde, exclamation, at, hash, dollar, percent, caret, ampersand, asterisk, equals, plus, slash, pipe, colon, semicolon, less_than, greater_than, question, tab, form_feed, ];

const identifier: binding = {
  binder: "identifier",
  patterns: [
    {
      tag: "match",
      scope: "variable.name",
      rex: negative(
        punct.reduce(
          (acc, x): regex => choice(acc, code_point(x)),
          code_point(space),
        ),
      ),
    },
  ],
};

const brackets: binding = {
  binder: "delimiter.unobtrusive",
  patterns: [
    {
      tag: "match",
      scope: "unobtrusive",
      rex: choice(
        choice(
          choice(code_point(open_paren), code_point(close_paren)),
          choice(code_point(open_brace), code_point(close_brace)),
        ),
        choice(code_point(open_bracket), code_point(close_bracket)),
      ),
    },
  ],
};

const interpolation: binding = {
  binder: "interpolation",
  patterns: [
    {
      tag: "surround",
      scope: "",
      begin: code_point(open_brace),
      end: code_point(close_brace),
      begin_pats: [{ tag: "variable", name: "delimiter.unobtrusive" }],
      end_pats: [{ tag: "variable", name: "delimiter.unobtrusive" }],
      patterns: [{ tag: "variable", name: "sexp" }],
    },
  ],
};

const string: binding = {
  binder: "string",
  patterns: [
    {
      tag: "surround",
      scope: "string.interpolated",
      begin: code_point(double_quote),
      end: code_point(double_quote),
      begin_pats: [],
      end_pats: [],
      patterns: [{ tag: "variable", name: "interpolation" }],
    },
  ],
};

// prettier-ignore
const digit: regex = [ num_1, num_2, num_3, num_4, num_5, num_6, num_7, num_8, num_9, ].reduce((acc, x): regex => choice(acc, code_point(x)), code_point(num_0));

const integer: binding = {
  binder: "integer",
  patterns: [
    {
      tag: "match",
      scope: "constant.numeric",
      rex: concat(digit, repeat(digit)),
    },
  ],
};

// const println = console.log;

// import * as fs from "node:fs";
// import * as cp from "node:child_process";

// const sexp: grammar = {
//   name: "sexp",
//   bindings: [keywords, integer, identifier, string, interpolation, brackets],
// };

// const text = JSON.stringify(grammar.to_json(sexp));
// const path = "playground/hl.json";
// fs.writeFileSync(path, text, { encoding: "utf8" });

// cp.exec(`prettier ${path} -w`);

// console.log({
//   match: identifier,
// });
