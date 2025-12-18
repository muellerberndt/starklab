/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { parseProgram, compileProgram } from '../core/dsl';
import { execute, collectRegisters, type TraceRow } from '../core/vm';
import { buildAir, summarize, type AirModel } from '../core/air';
import { mod } from '../core/math';

interface StarkState {
    code: string;
    setCode: (code: string) => void;
    prime: number;
    trace: TraceRow[];
    regNames: string[];
    air: AirModel | null;
    failures: { where: string; expr: string; value: number }[];
    error: string | null;
    tamperTrace: () => void;
    resetTrace: () => void;
    resetCode: () => void;
}

const DEFAULT_CODE = `# Fibonacci Sequence
prime 257

# Initialize registers
r0 = 1
r1 = 1

# Calculate next 10 Fibonacci numbers
repeat 10:
    r2 = r0 + r1
    r0 = r1
    r1 = r2

halt
`;

const StarkContext = createContext<StarkState | undefined>(undefined);

function toErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    return String(e);
}

export function StarkProvider({ children }: { children: React.ReactNode }) {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [error, setError] = useState<string | null>(null);
    const [prime, setPrime] = useState<number>(97);
    const [trace, setTrace] = useState<TraceRow[]>([]);
    const [regNames, setRegNames] = useState<string[]>([]);
    const [air, setAir] = useState<AirModel | null>(null);
    const [failures, setFailures] = useState<{ where: string; expr: string; value: number }[]>([]);

    const generate = (source: string) => {
        try {
            setError(null);

            // 1. Parse & Compile
            const stmts = parseProgram(source);
            const program = compileProgram(stmts);
            setPrime(program.prime);

            // 2. Execute
            const registers = collectRegisters(program.steps);
            const rows = execute(program.steps, program.prime, registers);

            // 3. Build AIR
            const airModel = buildAir(program.steps, rows, program.prime, registers);
            const summary = summarize(airModel);

            setRegNames(registers);
            setTrace(rows);
            setAir(airModel);
            setFailures(summary.failures);

        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setTrace([]);
            setRegNames([]);
            setAir(null);
            setFailures([]);
        }
    };

    const tamperTrace = () => {
        if (trace.length === 0) return;

        // Deep copy trace
        const newTrace = JSON.parse(JSON.stringify(trace));

        // Pick random row (not first/last to avoid boundary issues sometimes, but let's just do any)
        const rowIdx = Math.floor(Math.random() * newTrace.length);
        const reg = regNames[Math.floor(Math.random() * regNames.length)];

        // Corrupt value
        const oldVal = newTrace[rowIdx].regs[reg];
        newTrace[rowIdx].regs[reg] = mod(oldVal + 1337, prime); // Ensure it changes

        // Re-run AIR check on TAMPERED trace
        // We need to re-compile to get the steps for AIR building
        try {
            const stmts = parseProgram(code);
            const program = compileProgram(stmts);
            const airModel = buildAir(program.steps, newTrace, program.prime, regNames);
            const summary = summarize(airModel);

            setPrime(program.prime);
            setTrace(newTrace);
            setAir(airModel);
            setFailures(summary.failures);
        } catch (e) {
            console.error("Failed to re-check tampered trace", e);
        }
    };

    const resetTrace = () => {
        generate(code);
    };

    const resetCode = () => {
        setCode(DEFAULT_CODE);
    };

    useEffect(() => {
        const timer = setTimeout(() => generate(code), 500);
        return () => clearTimeout(timer);
    }, [code]);

    return (
        <StarkContext.Provider value={{ code, setCode, prime, trace, regNames, air, failures, error, tamperTrace, resetTrace, resetCode }}>
            {children}
        </StarkContext.Provider>
    );
}

export function useStark() {
    const context = useContext(StarkContext);
    if (context === undefined) {
        throw new Error('useStark must be used within a StarkProvider');
    }
    return context;
}
