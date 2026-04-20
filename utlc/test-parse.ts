import { parse_expr } from "../utlc/parse_expr";
import * as fs from "fs";
import * as path from "path";

// 从命令行参数获取文件路径，若未提供则默认使用 ./test/test.utlc
const args = process.argv.slice(2);
const defaultPath = path.join(process.cwd(), "test", "test.utlc");
const filePath = args[0] ?? defaultPath;

let code: string;
try {
    code = fs.readFileSync(filePath, "utf-8");
    console.log(`读取文件: ${filePath}\n`);
} catch (error) {
    console.error(`无法读取文件: ${filePath}`);
    console.error(error);
    process.exit(1);
}

const result = parse_expr(code);

console.log("=== 表达式 (exprs) ===");
console.dir(result.exprs, { depth: null });

console.log("\n=== 错误 (errors) ===");
console.dir(result.errors, { depth: null });