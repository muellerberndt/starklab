import { isProbablyPrime } from "./math";

export const MAX_REGISTER = 9;

export type Statement =
    | { type: "repeat"; times: number; body: Statement[]; line: number; text: string }
    | { type: "halt"; line: number; text: string }
    | { type: "prime"; value: number; line: number; text: string }
    | { type: "assign"; target: string; expr: Expr; line: number; text: string };

type Block = { type: "block"; indent: number; stmts: Statement[] };

export type Expr =
    | { type: "add"; terms: Expr[]; text: string }
    | { type: "mul"; factors: Expr[]; text: string }
    | { type: "neg"; inner: Expr; text: string }
    | { type: "reg"; name: string; text: string }
    | { type: "lit"; value: number; text: string };

export type Step = {
    kind: "set" | "mov" | "add" | "mul" | "halt" | "assign";
    target?: string;
    expr?: Expr;
    source: { line: number; text: string };
};

export type CompiledProgram = {
    prime: number;
    steps: Step[];
};

export function parseProgram(text: string): Statement[] {
    const lines = text.split(/\r?\n/);
    const root: Block = { type: "block", indent: 0, stmts: [] };
    const stack: Block[] = [root];
    let pendingRepeat: { body: Statement[]; times: number; parentIndent: number } | null = null;

    function currentBlock(): Block {
        return stack[stack.length - 1];
    }

    function countIndent(raw: string): number {
        const expanded = raw.replace(/\t/g, "    ");
        let i = 0;
        while (i < expanded.length && expanded[i] === " ") i += 1;
        return i;
    }

    for (let i = 0; i < lines.length; i += 1) {
        const original = lines[i];
        const noComment = original.split("#")[0].replace(/\s+$/g, "");
        if (noComment.trim().length === 0) continue;

        const indent = countIndent(noComment);
        const content = noComment.trim();

        if (pendingRepeat) {
            if (indent <= pendingRepeat.parentIndent) {
                throw new Error(
                    `Line ${i + 1}: expected an indented block after 'repeat ${pendingRepeat.times}:'`
                );
            }
            const block: Block = { type: "block", indent, stmts: pendingRepeat.body };
            stack.push(block);
            pendingRepeat = null;
            // continue parsing this line inside the new block
        } else {
            while (indent < currentBlock().indent) stack.pop();
            if (indent !== currentBlock().indent) {
                throw new Error(`Line ${i + 1}: unexpected indentation`);
            }
        }

        // (recompute after pendingRepeat push)
        while (indent < currentBlock().indent) stack.pop();
        if (indent !== currentBlock().indent) {
            throw new Error(`Line ${i + 1}: unexpected indentation`);
        }

        // Statements
        const repeatMatch = content.match(/^repeat\s+(\d+)\s*:\s*$/);
        if (repeatMatch) {
            const times = Number.parseInt(repeatMatch[1], 10);
            if (!Number.isFinite(times) || times < 0) {
                throw new Error(`Line ${i + 1}: invalid repeat count`);
            }
            const node: Statement = { type: "repeat", times, body: [], line: i + 1, text: content };
            currentBlock().stmts.push(node);
            pendingRepeat = { body: node.body, times, parentIndent: indent };
            continue;
        }

        if (content === "halt") {
            currentBlock().stmts.push({ type: "halt", line: i + 1, text: content });
            continue;
        }

        const primeMatch = content.match(/^prime\s*(?:=\s*)?(\d+)\s*$/);
        if (primeMatch) {
            const value = Number.parseInt(primeMatch[1], 10);
            if (!Number.isFinite(value) || value < 2) {
                throw new Error(`Line ${i + 1}: invalid prime`);
            }
            currentBlock().stmts.push({ type: "prime", value, line: i + 1, text: content });
            continue;
        }

        const assignMatch = content.match(/^(r\d+)\s*=\s*(.+)$/);
        if (!assignMatch) {
            throw new Error(`Line ${i + 1}: could not parse statement`);
        }
        const target = assignMatch[1];
        const exprText = assignMatch[2].trim();
        const expr = parseExpr(exprText, i + 1);
        currentBlock().stmts.push({ type: "assign", target, expr, line: i + 1, text: content });
    }

    if (pendingRepeat) {
        throw new Error(`Line ${lines.length}: repeat block has no body`);
    }

    return root.stmts;
}

function parseExpr(text: string, lineNo: number): Expr {
    type Token =
        | { type: "op"; op: "+" | "-" | "*"; pos: number }
        | { type: "lparen"; pos: number }
        | { type: "rparen"; pos: number }
        | { type: "reg"; name: string; pos: number }
        | { type: "lit"; raw: string; value: number; pos: number };

    function tokenize(): Token[] {
        const tokens: Token[] = [];
        for (let i = 0; i < text.length; ) {
            const ch = text[i];
            if (/\s/.test(ch)) {
                i += 1;
                continue;
            }
            if (ch === "+" || ch === "-" || ch === "*") {
                tokens.push({ type: "op", op: ch, pos: i });
                i += 1;
                continue;
            }
            if (ch === "(") {
                tokens.push({ type: "lparen", pos: i });
                i += 1;
                continue;
            }
            if (ch === ")") {
                tokens.push({ type: "rparen", pos: i });
                i += 1;
                continue;
            }
            if (ch === "r") {
                let j = i + 1;
                while (j < text.length && /[0-9]/.test(text[j])) j += 1;
                if (j === i + 1) {
                    throw new Error(`Line ${lineNo}: invalid register reference near '${text.slice(i)}'`);
                }
                const name = text.slice(i, j);
                tokens.push({ type: "reg", name, pos: i });
                i = j;
                continue;
            }
            if (/[0-9]/.test(ch)) {
                let j = i;
                while (j < text.length && /[0-9]/.test(text[j])) j += 1;
                const raw = text.slice(i, j);
                tokens.push({ type: "lit", raw, value: Number.parseInt(raw, 10), pos: i });
                i = j;
                continue;
            }
            throw new Error(`Line ${lineNo}: unexpected character '${ch}' in expression`);
        }
        return tokens;
    }

    const tokens = tokenize();
    if (tokens.length === 0) throw new Error(`Line ${lineNo}: empty expression`);

    let cursor = 0;
    const peek = () => tokens[cursor] ?? null;
    const consume = () => {
        const tok = tokens[cursor];
        cursor += 1;
        return tok;
    };

    function parsePrimary(): Expr {
        const tok = peek();
        if (!tok) throw new Error(`Line ${lineNo}: unexpected end of expression`);

        if (tok.type === "lit") {
            consume();
            return { type: "lit", value: tok.value, text: tok.raw };
        }
        if (tok.type === "reg") {
            consume();
            return { type: "reg", name: tok.name, text: tok.name };
        }
        if (tok.type === "lparen") {
            consume();
            const inner = parseSum();
            const close = peek();
            if (!close || close.type !== "rparen") {
                throw new Error(`Line ${lineNo}: missing ')' in expression`);
            }
            consume();
            return inner;
        }
        throw new Error(`Line ${lineNo}: unexpected token in expression`);
    }

    function parseUnary(): Expr {
        const tok = peek();
        if (tok?.type === "op" && tok.op === "-") {
            consume();
            const inner = parseUnary();
            return { type: "neg", inner, text };
        }
        return parsePrimary();
    }

    function parseProduct(): Expr {
        const factors: Expr[] = [parseUnary()];
        while (true) {
            const tok = peek();
            if (!tok || tok.type !== "op" || tok.op !== "*") break;
            consume();
            factors.push(parseUnary());
        }
        if (factors.length === 1) return factors[0];
        return { type: "mul", factors, text };
    }

    function parseSum(): Expr {
        const terms: Expr[] = [parseProduct()];
        while (true) {
            const tok = peek();
            if (!tok || tok.type !== "op" || (tok.op !== "+" && tok.op !== "-")) break;
            consume();
            const rhs = parseProduct();
            terms.push(tok.op === "+" ? rhs : { type: "neg", inner: rhs, text });
        }
        if (terms.length === 1) return terms[0];
        return { type: "add", terms, text };
    }

    const expr = parseSum();
    if (cursor !== tokens.length) {
        const tok = tokens[cursor];
        throw new Error(`Line ${lineNo}: unexpected token near '${text.slice(tok.pos)}'`);
    }
    return expr;
}

export function compileProgram(stmts: Statement[]): CompiledProgram {
    let prime = 97;
    const steps: Step[] = [];
    let seenHalt = false;
    let seenPrime = false;
    let seenNonPrime = false;

    function emitStep(step: Step) {
        if (seenHalt) {
            throw new Error(`Line ${step.source.line}: code after halt is not allowed`);
        }
        steps.push(step);
        if (step.kind === "halt") seenHalt = true;
    }

    function walk(list: Statement[]) {
        for (const s of list) {
            if (s.type === "prime") {
                if (seenPrime) {
                    throw new Error(`Line ${s.line}: prime was already set (only one 'prime' statement is allowed)`);
                }
                if (seenNonPrime || steps.length > 0) {
                    throw new Error(`Line ${s.line}: 'prime' must appear before any instructions`);
                }
                if (!isProbablyPrime(s.value)) {
                    throw new Error(`Line ${s.line}: modulus ${s.value} is not prime (finite fields require a prime modulus)`);
                }
                prime = s.value;
                seenPrime = true;
                continue;
            }
            if (s.type === "repeat") {
                seenNonPrime = true;
                for (let i = 0; i < s.times; i += 1) walk(s.body);
                continue;
            }
            if (s.type === "halt") {
                seenNonPrime = true;
                emitStep({ kind: "halt", source: { line: s.line, text: s.text } });
                continue;
            }
            if (s.type === "assign") {
                seenNonPrime = true;
                validateRegisterName(s.target, s.line);
                validateExprRegisters(s.expr, s.line);
                const kind = classifyAssign(s.expr);
                emitStep({
                    kind,
                    target: s.target,
                    expr: s.expr,
                    source: { line: s.line, text: s.text },
                });
                continue;
            }
            const _exhaustive: never = s;
            throw new Error(`Unknown statement type: ${String(_exhaustive)}`);
        }
    }

    walk(stmts);
    if (steps.length === 0) {
        throw new Error("Program is empty (no executable statements)");
    }
    return { prime, steps };
}

export function classifyAssign(expr: Expr): "set" | "mov" | "add" | "mul" | "assign" {
    if (expr.type === "lit") return "set";
    if (expr.type === "reg") return "mov";
    if (expr.type === "add") return "add";
    if (expr.type === "mul") return "mul";
    return "assign";
}

function validateRegisterName(name: string, lineNo: number) {
    const m = name.match(/^r(\d+)$/);
    if (!m) throw new Error(`Line ${lineNo}: invalid register '${name}'`);
    const idx = Number.parseInt(m[1], 10);
    if (!Number.isFinite(idx) || idx < 0 || idx > MAX_REGISTER) {
        throw new Error(`Line ${lineNo}: unsupported register '${name}' (use r0..r${MAX_REGISTER})`);
    }
}

function validateExprRegisters(expr: Expr, lineNo: number) {
    if (expr.type === "reg") return validateRegisterName(expr.name, lineNo);
    if (expr.type === "lit") return;
    if (expr.type === "neg") return validateExprRegisters(expr.inner, lineNo);
    if (expr.type === "add") return expr.terms.forEach((t) => validateExprRegisters(t, lineNo));
    if (expr.type === "mul") return expr.factors.forEach((t) => validateExprRegisters(t, lineNo));
    // @ts-expect-error exhaustive
    throw new Error(`Line ${lineNo}: unknown expression type '${expr.type}'`);
}
