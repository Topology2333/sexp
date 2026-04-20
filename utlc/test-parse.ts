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
    // 统一换行符：将 Windows 的 CRLF 和独立的 CR 都转换为 LF
    code = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    console.log(`读取文件: ${filePath}\n`);
} catch (error) {
    console.error(`无法读取文件: ${filePath}`);
    console.error(error);
    process.exit(1);
}

const result = parse_expr(code);

console.log("=== 表达式 (exprs) ===");
if (result.exprs.length === 0) {
    console.log("(无)");
} else {
    result.exprs.forEach((expr, index) => {
        console.log(`--- 表达式 ${index + 1} ---`);
        console.dir(expr, { depth: null });
        console.log();
    });
}

console.log("\n=== 错误 (errors) ===");
if (result.errors.length === 0) {
    console.log("(无)");
} else {
    result.errors.forEach((err, index) => {
        console.log(`--- 错误 ${index + 1} ---`);
        console.log(`消息: ${err.message}`);
        console.log(`范围: (${err.range.start.line}:${err.range.start.character}) -> (${err.range.end.line}:${err.range.end.character})`);
        console.log();
    });
}