import { mod } from "./math";
import type { Step, Expr } from "./dsl";
import { evalExpr } from "./vm";
import type { TraceRow } from "./vm";

export type Constraint = {
    id: string;
    expr: string;
    eval: () => number;
    why: string;
};

export type AirModel = {
    boundary: Constraint[];
    transitions: {
        stepIndex: number;
        source: { line: number; text: string };
        kind: string;
        constraints: Constraint[];
    }[];
};

export function buildAir(steps: Step[], rows: TraceRow[], p: number, regNames: string[]): AirModel {
    const boundary: Constraint[] = [];
    boundary.push({
        id: "pc0",
        expr: "pc(0) - 0 = 0",
        eval: () => mod(rows[0].pc - 0, p),
        why: "The trace starts at pc = 0.",
    });
    boundary.push({
        id: "halted0",
        expr: "halted(0) - 0 = 0",
        eval: () => mod(rows[0].halted - 0, p),
        why: "The machine starts unhalted.",
    });
    for (const r of regNames) {
        boundary.push({
            id: `init_${r}`,
            expr: `${r}(0) - 0 = 0`,
            eval: () => mod(rows[0].regs[r] - 0, p),
            why: `All registers start at 0 in this toy VM.`,
        });
    }

    const transitions = [];
    for (let i = 0; i < steps.length; i += 1) {
        const step = steps[i];
        const curr = rows[i];
        const next = rows[i + 1];
        const constraints: Constraint[] = [];

        constraints.push({
            id: `halted_curr_${i}`,
            expr: `halted(${i}) = 0`,
            eval: () => mod(curr.halted - 0, p),
            why: "We only execute instructions while halted=0.",
        });

        constraints.push({
            id: `pc_step_${i}`,
            expr: `pc(${i + 1}) - (pc(${i}) + 1) = 0`,
            eval: () => mod(next.pc - (curr.pc + 1), p),
            why: "Each step increments the program counter by 1.",
        });

        if (step.kind === "halt") {
            constraints.push({
                id: `halted_next_${i}`,
                expr: `halted(${i + 1}) - 1 = 0`,
                eval: () => mod(next.halted - 1, p),
                why: "HALT sets halted=1.",
            });
            for (const r of regNames) {
                constraints.push({
                    id: `halt_keep_${r}_${i}`,
                    expr: `${r}(${i + 1}) - ${r}(${i}) = 0`,
                    eval: () => mod(next.regs[r] - curr.regs[r], p),
                    why: "HALT does not change registers.",
                });
            }
        } else {
            constraints.push({
                id: `halted_next_${i}`,
                expr: `halted(${i + 1}) - 0 = 0`,
                eval: () => mod(next.halted - 0, p),
                why: "Normal instructions keep halted=0.",
            });

            const target = step.target!;
            const exprValue = evalExpr(step.expr!, curr.regs, p);
            constraints.push({
                id: `write_${target}_${i}`,
                expr: `${target}(${i + 1}) - (${prettyExpr(step.expr!)}) = 0`,
                eval: () => mod(next.regs[target] - exprValue, p),
                why: `This enforces the assignment '${step.source.text}'.`,
            });

            for (const r of regNames) {
                if (r === target) continue;
                constraints.push({
                    id: `keep_${r}_${i}`,
                    expr: `${r}(${i + 1}) - ${r}(${i}) = 0`,
                    eval: () => mod(next.regs[r] - curr.regs[r], p),
                    why: "Registers not written by the instruction stay the same.",
                });
            }
        }

        transitions.push({
            stepIndex: i,
            source: step.source,
            kind: step.kind,
            constraints,
        });
    }

    return { boundary, transitions };
}

function prettyExpr(expr: Expr): string {
    if (expr.type === "lit") return String(expr.value);
    if (expr.type === "reg") return expr.name;
    if (expr.type === "add") return expr.terms.map(prettyExpr).join(" + ");
    return "?";
}

export function summarize(air: AirModel) {
    let total = 0;
    let failing = 0;
    const failures: { where: string; expr: string; value: number }[] = [];

    for (const c of air.boundary) {
        total += 1;
        const v = c.eval();
        if (v !== 0) {
            failing += 1;
            failures.push({ where: "boundary", expr: c.expr, value: v });
        }
    }

    for (const t of air.transitions) {
        for (const c of t.constraints) {
            total += 1;
            const v = c.eval();
            if (v !== 0) {
                failing += 1;
                failures.push({ where: `step ${t.stepIndex}`, expr: c.expr, value: v });
            }
        }
    }

    return { total, failing, failures };
}
