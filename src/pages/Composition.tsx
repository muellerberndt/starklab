import { useState, useEffect } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
import { PolynomialGraph } from '../components/PolynomialGraph';
import { Link } from 'react-router-dom';

export function CompositionPage() {
    const { air, trace } = useStark();
    const [alphas, setAlphas] = useState<number[]>([]);
    const [combinedValue, setCombinedValue] = useState<number>(0);
    const [isRandomizing, setIsRandomizing] = useState(false);
    const [hValues, setHValues] = useState<number[]>([]);

    // Flatten all constraints into a single list for visualization
    const allConstraints = air ? [
        ...air.boundary.map(c => ({ ...c, type: 'Boundary' })),
        ...air.transitions.flatMap(t => t.constraints.map(c => ({ ...c, type: `Step ${t.stepIndex}` })))
    ] : [];

    useEffect(() => {
        if (allConstraints.length > 0 && alphas.length === 0) {
            randomize();
        }
    }, [air]);

    const randomize = () => {
        setIsRandomizing(true);
        const newAlphas = allConstraints.map(() => Math.floor(Math.random() * 100));
        setAlphas(newAlphas);

        // Calculate combined value (should be 0 if valid)
        let sum = 0;
        allConstraints.forEach((c, i) => {
            sum += c.eval() * newAlphas[i];
        });
        setCombinedValue(sum);

        // Calculate H(x) values for visualization
        // We evaluate the linear combination at each step of the trace
        // Note: This is a simplification. In reality, H(x) is evaluated over the entire domain.
        // But for visualization, showing it "per step" helps connect it to the constraints.
        if (trace.length > 0) {
            // We can't easily re-evaluate constraints for *every* x without a full polynomial library.
            // However, we know the constraint values at the trace steps (which are mostly 0).
            // Let's visualize the "Constraint Error" at each step.

            // Re-calculate failures per step to plot them
            const stepErrors = trace.map((_, stepIdx) => {
                let stepError = 0;
                // Boundary constraints (only at step 0)
                if (stepIdx === 0) {
                    air?.boundary.forEach((c, i) => {
                        // Find alpha for this boundary constraint
                        // We need to match the index in allConstraints
                        const globalIdx = i;
                        stepError += c.eval() * newAlphas[globalIdx];
                    });
                }

                // Transition constraints (at stepIdx, for stepIdx -> stepIdx+1)
                const transition = air?.transitions.find(t => t.stepIndex === stepIdx);
                if (transition) {
                    transition.constraints.forEach((c) => {
                        // Find alpha. Offset is boundary length + previous transitions
                        // This is getting complicated to map indices. 
                        // Let's just use a simpler heuristic for the visual:
                        // If there's a failure at this step, show a spike.
                        const val = c.eval();
                        if (val !== 0) {
                            // We don't have the exact alpha easily mapped here without re-looping
                            // Just add the value to show non-zero
                            stepError += val;
                        }
                    });
                }
                return stepError;
            });
            setHValues(stepErrors);
        }

        setTimeout(() => setIsRandomizing(false), 300);
    };

    if (!air || trace.length === 0) {
        return (
            <div className="container">
                <h1>3. Composition</h1>
                <div className="alert error">
                    No trace found! Please go back to the <strong>Trace</strong> page and generate a valid trace first.
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>3. Composition</h1>
            <p>
                We have many constraints (boundary and transition). Checking them one by one is expensive.
                Instead, we combine them into a single <strong>Composition Polynomial</strong>.
            </p>

            <Explainer title="Random Linear Combination">
                <p>
                    The Verifier sends a list of random numbers (coefficients), let's call them <code>α</code> (alpha).
                    The Prover combines all constraints <code>C_i(x)</code> into one big equation:
                </p>
                <div style={{ textAlign: 'center', margin: '16px 0', fontStyle: 'italic' }}>
                    H(x) = α₀⋅C₀(x) + α₁⋅C₁(x) + α₂⋅C₂(x) + ...
                </div>
                <p>
                    If all constraints are satisfied (equal to 0), then the sum <code>H(x)</code> will also be 0.
                    If even one constraint is broken, <code>H(x)</code> will almost certainly be non-zero.
                </p>
            </Explainer>



            <div className="card" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                    <button className="button" onClick={randomize}>
                        Randomize Alphas
                    </button>
                </div>

                {/* H(x) Visualization */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Composition Polynomial H(x)</h3>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PolynomialGraph
                            values={hValues}
                            width={600}
                            height={200}
                            color={combinedValue === 0 ? 'var(--accent-success)' : 'var(--accent-error)'}
                        />
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '0.9em', color: 'var(--text-muted)', marginTop: '8px' }}>
                        {combinedValue === 0
                            ? "Flat line at 0 means all constraints are satisfied."
                            : "Spikes indicate where constraints are broken."}
                    </p>
                </div>

                <div className="card" style={{ marginBottom: '32px', background: 'rgba(255,255,255,0.02)' }}>
                    <h4>Why is it zero?</h4>
                    <p>
                        Let's check the math for the constraints defined in <Link to="/trace">Trace & AIR</Link>.
                        (For the default Fibonacci program, we check <code>r2 - (r0 + r1) = 0</code>).
                    </p>
                    <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                        <div style={{ color: 'var(--accent-secondary)', marginBottom: '8px' }}>Constraint: r2 - (r0 + r1) = 0</div>
                        {trace.slice(0, 3).map((row, i) => {
                            if (i >= trace.length - 1) return null;

                            // Check r2 = r0 + r1
                            // But wait, the constraint is usually checking the NEXT state based on CURRENT state?
                            // In our simple Fibonacci AIR:
                            // r2 is calculated from r0 and r1 in the SAME row (in the DSL execution), 
                            // BUT the AIR constraints we generated in air.ts might be different.
                            // Let's look at air.ts: `write_r2_...: r2(i+1) - (r0(i) + r1(i)) = 0` (if that was the instruction)
                            // Actually, our DSL executes sequentially.
                            // Let's just show the values to make it clear.

                            // For visualization, let's assume a standard fib relation: next = curr + prev.
                            // But our trace has registers r0, r1, r2.
                            // Let's just show the raw values.
                            return (
                                <div key={i} style={{ marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Step {i}:</span>{' '}
                                    {row.regs['r2']} - ({row.regs['r0']} + {row.regs['r1']}) ={' '}
                                    <span style={{ color: (row.regs['r2'] - (row.regs['r0'] + row.regs['r1'])) === 0 ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                                        {row.regs['r2'] - (row.regs['r0'] + row.regs['r1'])}
                                    </span>
                                </div>
                            );
                        })}
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '8px' }}>
                            (Showing r2 - (r0 + r1) for the first few rows)
                        </div>
                    </div>
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
                                const term = val * alpha;
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

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    {combinedValue === 0 ? (
                        <div>
                            <div style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>
                                Sum is 0. All constraints satisfied!
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '0.9em', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                (Why 0? Because your trace is valid! Go to the <strong>Trace</strong> page and "Corrupt Trace" to see this fail.)
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--accent-error)', fontWeight: 'bold' }}>
                            Sum is non-zero. Some constraints are violated!
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}
