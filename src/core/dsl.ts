

export type Statement =
    | { type: "block"; indent: number; stmts: Statement[] }
    | { type: "repeat"; times: number; body: Statement[]; line: number; text: string }
    | { type: "halt"; line: number; text: string }
    | { type: "prime"; value: number; line: number; text: string }
    | { type: "assign"; target: string; expr: Expr; line: number; text: string };

export type Expr =
    | { type: "add"; terms: Expr[]; text: string }
    | { type: "reg"; name: string; text: string }
    | { type: "lit"; value: number; text: string };

export type Step = {
    kind: "set" | "mov" | "add" | "halt" | "assign";
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
    const root: Statement = { type: "block", indent: 0, stmts: [] };
    const stack: Statement[] = [root];
    let pendingRepeat: { body: Statement[]; times: number; parentIndent: number } | null = null;

    function currentBlock(): Statement {
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
            const block: Statement = { type: "block", indent, stmts: pendingRepeat.body };
            stack.push(block);
            pendingRepeat = null;
            // continue parsing this line inside the new block
        } else {
            while (indent < (currentBlock() as any).indent) stack.pop();
            if (indent !== (currentBlock() as any).indent) {
                throw new Error(`Line ${i + 1}: unexpected indentation`);
            }
        }

        // (recompute after pendingRepeat push)
        while (indent < (currentBlock() as any).indent) stack.pop();
        if (indent !== (currentBlock() as any).indent) {
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
            (currentBlock() as any).stmts.push(node);
            pendingRepeat = { body: node.body, times, parentIndent: indent };
            continue;
        }

        if (content === "halt") {
            (currentBlock() as any).stmts.push({ type: "halt", line: i + 1, text: content });
            continue;
        }

        const primeMatch = content.match(/^prime\s*(?:=\s*)?(\d+)\s*$/);
        if (primeMatch) {
            const value = Number.parseInt(primeMatch[1], 10);
            if (!Number.isFinite(value) || value < 2) {
                throw new Error(`Line ${i + 1}: invalid prime`);
            }
            (currentBlock() as any).stmts.push({ type: "prime", value, line: i + 1, text: content });
            continue;
        }

        const assignMatch = content.match(/^(r\d+)\s*=\s*(.+)$/);
        if (!assignMatch) {
            throw new Error(`Line ${i + 1}: could not parse statement`);
        }
        const target = assignMatch[1];
        const exprText = assignMatch[2].trim();
        const expr = parseExpr(exprText, i + 1);
        (currentBlock() as any).stmts.push({ type: "assign", target, expr, line: i + 1, text: content });
    }

    if (pendingRepeat) {
        throw new Error(`Line ${lines.length}: repeat block has no body`);
    }

    return (root as any).stmts;
}

function parseExpr(text: string, lineNo: number): Expr {
    const parts = text.split("+").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) throw new Error(`Line ${lineNo}: empty expression`);
    const terms = parts.map((t) => parseTerm(t, lineNo));
    if (terms.length === 1) return terms[0];
    return { type: "add", terms, text };
}

function parseTerm(text: string, lineNo: number): Expr {
    if (/^r\d+$/.test(text)) return { type: "reg", name: text, text };
    if (/^\d+$/.test(text)) return { type: "lit", value: Number.parseInt(text, 10), text };
    throw new Error(`Line ${lineNo}: invalid term '${text}'`);
}

export function compileProgram(stmts: Statement[]): CompiledProgram {
    let prime = 97;
    const steps: Step[] = [];
    let seenHalt = false;

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
                prime = s.value;
                continue;
            }
            if (s.type === "repeat") {
                for (let i = 0; i < s.times; i += 1) walk(s.body);
                continue;
            }
            if (s.type === "halt") {
                emitStep({ kind: "halt", source: { line: s.line, text: s.text } });
                continue;
            }
            if (s.type === "assign") {
                const kind = classifyAssign(s.expr);
                emitStep({
                    kind,
                    target: s.target,
                    expr: s.expr,
                    source: { line: s.line, text: s.text },
                });
                continue;
            }
            // @ts-ignore
            throw new Error(`Line ${s.line}: unknown statement type '${s.type}'`);
        }
    }

    walk(stmts);
    if (steps.length === 0) {
        throw new Error("Program is empty (no executable statements)");
    }
    return { prime, steps };
}

export function classifyAssign(expr: Expr): "set" | "mov" | "add" | "assign" {
    if (expr.type === "lit") return "set";
    if (expr.type === "reg") return "mov";
    if (expr.type === "add") return "add";
    return "assign";
}
