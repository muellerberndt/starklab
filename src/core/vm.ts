import { mod } from "./math";
import type { Expr, Step } from "./dsl";

export type TraceRow = {
    pc: number;
    halted: number;
    regs: Record<string, number>;
};

export function evalExpr(expr: Expr, regs: Record<string, number>, p: number): number {
    if (expr.type === "lit") return mod(expr.value, p);
    if (expr.type === "reg") return regs[expr.name] ?? 0;
    if (expr.type === "add") {
        const sum = expr.terms.reduce((acc, t) => acc + evalExpr(t, regs, p), 0);
        return mod(sum, p);
    }
    throw new Error(`Unknown expr type '${(expr as any).type}'`);
}

export function collectRegisters(steps: Step[]): string[] {
    const names = new Set(["r0", "r1", "r2"]);
    function visitExpr(expr: Expr) {
        if (expr.type === "reg") names.add(expr.name);
        if (expr.type === "add") expr.terms.forEach(visitExpr);
    }
    for (const s of steps) {
        if (s.target) names.add(s.target);
        if (s.expr) visitExpr(s.expr);
    }
    const arr = [...names].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    const capped = arr.filter((r) => Number(r.slice(1)) >= 0 && Number(r.slice(1)) <= 7);
    return capped;
}

export function execute(steps: Step[], p: number, regNames: string[]): TraceRow[] {
    const regs: Record<string, number> = {};
    for (const r of regNames) regs[r] = 0;

    const rows: TraceRow[] = [];
    let state = { pc: 0, halted: 0, regs: { ...regs } };
    rows.push(state);

    for (let i = 0; i < steps.length; i += 1) {
        const step = steps[i];
        const next = {
            pc: state.pc + 1,
            halted: state.halted,
            regs: { ...state.regs },
        };

        if (state.halted !== 0) {
            throw new Error(`Step ${i}: attempted to execute while halted`);
        }

        if (step.kind === "halt") {
            next.halted = 1;
        } else {
            const target = step.target!;
            if (!regNames.includes(target)) {
                throw new Error(`Line ${step.source.line}: unsupported register '${target}' (use r0..r7)`);
            }
            next.regs[target] = evalExpr(step.expr!, state.regs, p);
        }

        rows.push(next);
        state = next;
    }

    return rows;
}
