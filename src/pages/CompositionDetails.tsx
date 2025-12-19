import { useMemo, useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { PolynomialGraph } from '../components/PolynomialGraph';
import { Explainer } from '../components/Explainer';
import { Link } from 'react-router-dom';
import { mod } from '../core/math';

function mulberry32(seed: number) {
    let t = seed >>> 0;
    return () => {
        t += 0x6D2B79F5;
        let x = Math.imul(t ^ (t >>> 15), 1 | t);
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

export function CompositionDetailsPage() {
    const { air, trace, prime } = useStark();
    const [isRandomizing, setIsRandomizing] = useState(false);
    const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
    const [selectedStep, setSelectedStep] = useState<number | null>(null);

    const allConstraints = useMemo(() => {
        if (!air) return [];
        let globalIndex = 0;

        const out = [
            ...air.boundary.map((c) => ({ ...c, type: 'Boundary', stepIndex: 0, globalIndex: globalIndex++ })),
            ...air.transitions.flatMap((t) =>
                t.constraints.map((c) => ({ ...c, type: `Step ${t.stepIndex}`, stepIndex: t.stepIndex, globalIndex: globalIndex++ }))
            ),
        ];

        return out;
    }, [air]);

    const alphas = useMemo(() => {
        const rand = mulberry32(seed);
        return allConstraints.map(() => Math.floor(rand() * prime));
    }, [allConstraints, prime, seed]);

    const combinedValue = useMemo(() => {
        let sum = 0;
        allConstraints.forEach((c, i) => {
            sum = mod(sum + c.eval() * (alphas[i] ?? 0), prime);
        });
        return sum;
    }, [allConstraints, alphas, prime]);

    const hValues = useMemo(() => {
        if (!air || trace.length === 0) return [];
        const values = Array.from({ length: trace.length }, () => 0);
        allConstraints.forEach((c, i) => {
            const stepIndex = c.stepIndex ?? 0;
            if (stepIndex < 0 || stepIndex >= values.length) return;
            values[stepIndex] = mod(values[stepIndex] + c.eval() * (alphas[i] ?? 0), prime);
        });
        return values;
    }, [air, trace.length, allConstraints, alphas, prime]);

    const randomize = () => {
        setIsRandomizing(true);
        setSeed(Math.floor(Math.random() * 2 ** 31));
        setTimeout(() => setIsRandomizing(false), 300);
    };

    // Get constraints grouped by step
    const constraintsByStep = useMemo(() => {
        if (!air) return new Map<number, typeof allConstraints>();
        const map = new Map<number, typeof allConstraints>();

        // Boundary constraints at step -1 (special)
        const boundaryConstraints = allConstraints.filter(c => c.type === 'Boundary');
        if (boundaryConstraints.length > 0) {
            map.set(-1, boundaryConstraints);
        }

        // Transition constraints by step
        for (const c of allConstraints) {
            if (c.type !== 'Boundary') {
                const step = c.stepIndex;
                if (!map.has(step)) {
                    map.set(step, []);
                }
                map.get(step)!.push(c);
            }
        }

        return map;
    }, [air, allConstraints]);

    // Get the source instruction for each step
    const stepSources = useMemo(() => {
        if (!air) return new Map<number, string>();
        const map = new Map<number, string>();
        for (const t of air.transitions) {
            map.set(t.stepIndex, t.source.text);
        }
        return map;
    }, [air]);

    if (!air || trace.length === 0) {
        return (
            <div className="container">
                <h1>3.5 Composition Details</h1>
                <div className="alert error">
                    No trace found! Please go back to the <strong>Trace</strong> page and generate a valid trace first.
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>3.5 Composition Details</h1>
            <p>
                This page shows exactly how the {allConstraints.length} constraints from your program
                are combined into the composition polynomial H(x).
            </p>

            <Explainer title="Understanding Per-Step Constraints">
                <p>
                    Unlike textbook presentations that show a single constraint polynomial C(x) for the whole trace,
                    our toy VM generates <strong>separate constraints for each instruction</strong>.
                </p>
                <p>
                    Each step has multiple constraints: one for the instruction itself,
                    plus constraints ensuring unchanged registers stay the same,
                    the program counter increments, etc.
                </p>
                <p>
                    In production STARKs, these would be combined into a single constraint system
                    using selector polynomials. Here, we keep them separate for clarity.
                </p>
            </Explainer>

            {/* Step 1: Show the trace values */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Step 1: Your Trace (First Few Rows)</h3>
                <p>
                    These are the actual values from executing your program.
                    Each column becomes a polynomial via Lagrange interpolation.
                </p>
                <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                    <table className="trace-table" style={{ fontSize: '0.85em' }}>
                        <thead>
                            <tr>
                                <th>Step</th>
                                <th>pc</th>
                                {trace[0] && Object.keys(trace[0].regs).slice(0, 4).map(r => (
                                    <th key={r}>{r}</th>
                                ))}
                                <th>Instruction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trace.slice(0, 6).map((row, i) => (
                                <tr key={i} style={{
                                    cursor: 'pointer',
                                    background: selectedStep === i ? 'rgba(100, 200, 255, 0.1)' : undefined
                                }} onClick={() => setSelectedStep(selectedStep === i ? null : i)}>
                                    <td style={{ fontWeight: 'bold' }}>{i}</td>
                                    <td>{row.pc}</td>
                                    {Object.keys(row.regs).slice(0, 4).map(r => (
                                        <td key={r}>{row.regs[r]}</td>
                                    ))}
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
                                        {stepSources.get(i) || (i >= air.transitions.length ? '(padded)' : '')}
                                    </td>
                                </tr>
                            ))}
                            {trace.length > 6 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ... {trace.length - 6} more rows ...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Click a row to see its constraints below.
                </p>
            </div>

            {/* Step 2: Per-Step Constraints */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Step 2: Constraints for {selectedStep !== null ? `Step ${selectedStep}` : 'Each Step'}</h3>

                {selectedStep !== null ? (
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <strong>Instruction:</strong>{' '}
                            <code>{stepSources.get(selectedStep) || '(boundary/padded)'}</code>
                        </div>

                        {selectedStep === 0 && constraintsByStep.get(-1) && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ color: 'var(--accent-secondary)' }}>Boundary Constraints (Step 0)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {constraintsByStep.get(-1)!.map((c, i) => (
                                        <ConstraintCard key={i} constraint={c} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {constraintsByStep.get(selectedStep) && (
                            <div>
                                <h4 style={{ color: 'var(--accent-tertiary)' }}>Transition Constraints</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {constraintsByStep.get(selectedStep)!.map((c, i) => (
                                        <ConstraintCard key={i} constraint={c} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedStep(null)}
                            style={{ marginTop: '16px' }}
                        >
                            Show All Constraints
                        </button>
                    </div>
                ) : (
                    <div>
                        <p>
                            Your program generates <strong>{allConstraints.length}</strong> constraints total:
                        </p>
                        <ul style={{ marginTop: '8px' }}>
                            <li>{constraintsByStep.get(-1)?.length || 0} boundary constraints (initial state)</li>
                            <li>{allConstraints.length - (constraintsByStep.get(-1)?.length || 0)} transition constraints ({air.transitions.length} steps × ~{Math.round((allConstraints.length - (constraintsByStep.get(-1)?.length || 0)) / air.transitions.length)} each)</li>
                        </ul>
                        <p style={{ marginTop: '16px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            Click a trace row above to see its specific constraints.
                        </p>
                    </div>
                )}
            </div>

            {/* Step 3: Random Linear Combination */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Step 3: Random Linear Combination</h3>
                <p>
                    The verifier sends random coefficients (via Fiat-Shamir). The prover combines all constraints:
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontFamily: 'monospace', textAlign: 'center' }}>
                    H(x) = α₀·C₀(x) + α₁·C₁(x) + α₂·C₂(x) + ...
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                    <button className="button" onClick={randomize}>
                        Randomize Alphas
                    </button>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="trace-table" style={{ fontSize: '0.85em' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)' }}>
                            <tr>
                                <th>Type</th>
                                <th>Constraint</th>
                                <th>Value (C)</th>
                                <th>×</th>
                                <th>Alpha (α)</th>
                                <th>=</th>
                                <th>Term</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allConstraints.slice(0, 20).map((c, i) => {
                                const val = c.eval();
                                const alpha = alphas[i] ?? 0;
                                const term = mod(val * alpha, prime);
                                return (
                                    <tr key={i} style={{
                                        background: val !== 0 ? 'rgba(255, 0, 85, 0.1)' : undefined
                                    }}>
                                        <td className="muted">{c.type}</td>
                                        <td><code style={{ fontSize: '0.85em' }}>{c.expr}</code></td>
                                        <td style={{ color: val !== 0 ? 'var(--accent-error)' : 'var(--accent-success)' }}>
                                            {val}
                                        </td>
                                        <td className="muted">×</td>
                                        <td style={{ color: 'var(--accent-secondary)' }}>
                                            {isRandomizing ? '...' : alpha}
                                        </td>
                                        <td className="muted">=</td>
                                        <td>{term}</td>
                                    </tr>
                                );
                            })}
                            {allConstraints.length > 20 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ... {allConstraints.length - 20} more constraints ...
                                    </td>
                                </tr>
                            )}
                            <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 'bold' }}>
                                <td colSpan={6} style={{ textAlign: 'right' }}>Total Sum:</td>
                                <td style={{
                                    color: combinedValue !== 0 ? 'var(--accent-error)' : 'var(--accent-success)',
                                    fontSize: '1.2em'
                                }}>
                                    {combinedValue}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    {combinedValue === 0 ? (
                        <p style={{ color: 'var(--accent-success)' }}>
                            All constraint values are 0, so the sum is 0 regardless of the alphas.
                        </p>
                    ) : (
                        <p style={{ color: 'var(--accent-error)' }}>
                            Some constraints are non-zero! Try <Link to="/trace">corrupting the trace</Link> to see this.
                        </p>
                    )}
                </div>
            </div>

            {/* Result */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Result: H(x) at Each Step</h3>
                <p>
                    H(x) is the weighted sum of all constraints at each step.
                    For a valid trace, H(x) = 0 everywhere.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PolynomialGraph
                        values={hValues}
                        width={600}
                        height={200}
                        color={combinedValue === 0 ? 'var(--accent-success)' : 'var(--accent-error)'}
                    />
                </div>
                <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)' }}>
                    {combinedValue === 0
                        ? "H(x) = 0 at all trace points. Ready for the quotient step!"
                        : "H(x) is non-zero. The quotient Q(x) = H(x)/Z(x) won't be a valid polynomial."}
                </p>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <Link to="/composition" className="btn btn-ghost" style={{ marginRight: '16px' }}>
                    ← Back to Overview
                </Link>
                <Link to="/fri" className="button">
                    Continue to FRI →
                </Link>
            </div>
        </div>
    );
}

// Helper component for displaying a single constraint
function ConstraintCard({ constraint }: { constraint: { expr: string; why: string; eval: () => number } }) {
    const value = constraint.eval();
    const isSatisfied = value === 0;

    return (
        <div style={{
            padding: '12px',
            background: isSatisfied ? 'rgba(0, 255, 100, 0.05)' : 'rgba(255, 0, 85, 0.1)',
            borderRadius: '8px',
            borderLeft: `4px solid ${isSatisfied ? 'var(--accent-success)' : 'var(--accent-error)'}`
        }}>
            <div style={{ fontFamily: 'monospace', marginBottom: '4px' }}>
                <code>{constraint.expr}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                    {constraint.why}
                </span>
                <span style={{
                    fontWeight: 'bold',
                    color: isSatisfied ? 'var(--accent-success)' : 'var(--accent-error)'
                }}>
                    = {value} {isSatisfied ? '✓' : '✗'}
                </span>
            </div>
        </div>
    );
}
