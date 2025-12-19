import { useMemo, useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { PolynomialGraph } from '../components/PolynomialGraph';
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
                Let's look at exactly how the {allConstraints.length} constraints are combined into H(x).
            </p>

            {/* Step 1: Trace Polynomials */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Step 1: Trace Polynomials</h3>
                <p>
                    The prover interpolates each trace column into a polynomial. For example:
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ fontFamily: 'monospace', marginBottom: '8px' }}>
                        T_r0(x) interpolates r0 values: T_r0(0)={trace[0]?.regs['r0'] ?? '?'}, T_r0(1)={trace[1]?.regs['r0'] ?? '?'}, ...
                    </div>
                    <div style={{ fontFamily: 'monospace' }}>
                        T_r1(x) interpolates r1 values: T_r1(0)={trace[0]?.regs['r1'] ?? '?'}, T_r1(1)={trace[1]?.regs['r1'] ?? '?'}, ...
                    </div>
                </div>
                <p style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    These are the polynomials the prover committed to in step 2.
                </p>
            </div>

            {/* Step 2: Constraint Polynomials */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Step 2: Constraint Polynomials</h3>
                <p>
                    Each AIR constraint becomes a polynomial using the trace polynomials:
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <strong>AIR rule:</strong> <code>r1' = r0 + r1</code> (next r1 equals sum of current r0 and r1)
                    </div>
                    <div style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        C(x) = T_r1(x+1) - T_r0(x) - T_r1(x)
                    </div>
                </div>
                <p>
                    At each trace step x, this evaluates to:
                </p>
                <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                    {trace.slice(0, 4).map((row, i) => {
                        if (i >= trace.length - 1) return null;
                        const nextR1 = trace[i + 1]?.regs['r1'] ?? 0;
                        const currR0 = row.regs['r0'] ?? 0;
                        const currR1 = row.regs['r1'] ?? 0;
                        const diff = mod(nextR1 - currR0 - currR1, prime);
                        return (
                            <div key={i} style={{ marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>C({i}) =</span>{' '}
                                {nextR1} - {currR0} - {currR1} ={' '}
                                <span style={{ color: diff === 0 ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                                    {diff}
                                </span>
                            </div>
                        );
                    })}
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '8px' }}>...</div>
                </div>
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

                <div style={{ overflowX: 'auto' }}>
                    <table className="trace-table">
                        <thead>
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
                            {allConstraints.map((c, i) => {
                                const val = c.eval();
                                const alpha = alphas[i] ?? 0;
                                const term = mod(val * alpha, prime);
                                return (
                                    <tr key={i} style={{
                                        background: val !== 0 ? 'rgba(255, 0, 85, 0.1)' : undefined
                                    }}>
                                        <td className="muted">{c.type}</td>
                                        <td><code>{c.expr}</code></td>
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
                <h3>Result: H(x)</h3>
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
                <Link to="/composition" className="button" style={{ marginRight: '16px' }}>
                    ← Back to Overview
                </Link>
                <Link to="/fri" className="button">
                    Continue to FRI →
                </Link>
            </div>
        </div>
    );
}
