import * as emit from "./emit";
import * as check from "./check";
export { lower };

class EmitError extends Error {}

let lower_expr_to_regex = (env: environment, self: check.expr): emit.regex => {
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
      if (val === undefined) throw new EmitError();
      return val;
    }
    case "union":
    case "match":
    case "surround":
    case "hole":
      throw new EmitError();
  }
};

let lower_expr_to_patterns = (
  env: environment,
  self: check.expr,
): emit.pattern[] => {
  // prettier-ignore
  switch (self.tag) {
    case "union": { return self.children.flatMap(child => lower_expr_to_patterns(env,child)); }
    case "variable": { return [{ tag: "variable", name: self.name }]; }
    case "match": {
      const scope = self.scope.text;
      const rex = lower_expr_to_regex(env,self.rex);
      return [ { tag: "match", scope, rex }]
    }
    case "surround": {
      const scope = self.scope.text;
      const begin = lower_expr_to_regex(env,self.begin);
      const begin_pats = lower_expr_to_patterns(env,self.begin_pats);
      const end = lower_expr_to_regex(env,self.end);
      const end_pats = lower_expr_to_patterns(env,self.end_pats);
      const patterns = lower_expr_to_patterns(env,self.patterns);
      // prettier-ignore
      return [{ tag: "surround", scope, begin, begin_pats, end, end_pats, patterns, }];
    }
    case "concat": case "choice": case "repeat": case "negative": case "code_point": case "lstr": case "hole": {
      throw new EmitError();
    }
  }
};

type environment = Map<string, emit.regex>;

let lower_source = (env: environment, ast: check.stmt[]): emit.grammar => {
  let name = "";
  let bindings: emit.binding[] = [];
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

let lower = (ast: check.stmt[]): emit.grammar => {
  let env = new Map();
  return lower_source(env, ast);
};

// import * as fs from "node:fs";
// import * as cp from "node:child_process";

// import { parser } from "./sexp";
// import { infer_source } from "./check";
// let text = fs.readFileSync("./example.tm", { encoding: "utf-8" });
// let prs = parser.make(text);
// let sexp = parser.parse(prs);
// const ctx = { report: [], text, toplevel: new Map() };
// let ast = infer_source(ctx, sexp);

// let main = () => {
//   let lir = lower(ast);
//   let json = emit.grammar.to_json(lir);
//   let path = "playground/hl.json";
//   fs.writeFileSync(path, JSON.stringify(json), { encoding: "utf-8" });
//   cp.exec(`prettier ${path} -w`);
// };
// main();
