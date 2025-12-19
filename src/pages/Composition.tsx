import { useMemo } from 'react';
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

export function CompositionPage() {
    const { air, trace, prime } = useStark();

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

    // Use a fixed seed for consistent display
    const alphas = useMemo(() => {
        const rand = mulberry32(12345);
        return allConstraints.map(() => Math.floor(rand() * prime));
    }, [allConstraints, prime]);

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

    // Find a representative transition constraint to show
    const exampleTransition = useMemo(() => {
        if (!air || air.transitions.length === 0) return null;
        // Find a step with an assignment (not just halt)
        for (const t of air.transitions) {
            if (t.kind !== 'halt') {
                const assignmentConstraint = t.constraints.find(c => c.id.startsWith('write_'));
                if (assignmentConstraint) {
                    return {
                        stepIndex: t.stepIndex,
                        source: t.source.text,
                        constraint: assignmentConstraint
                    };
                }
            }
        }
        return null;
    }, [air]);

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
                Now we need to prove all {allConstraints.length} AIR constraints are satisfied,
                without the verifier checking each one individually. We combine them into a
                single <strong>composition polynomial</strong> H(x).
            </p>

            <Explainer title="The Big Picture">
                <p>
                    Each constraint says something like "the next value of r0 must equal the current r1".
                    For a valid trace, every constraint evaluates to <strong>0</strong>.
                </p>
                <p>
                    We combine all constraints with random weights. If even one constraint is non-zero,
                    the combined result will (with high probability) be non-zero.
                </p>
            </Explainer>

            {/* Step 1: Show what constraints look like */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Step 1: Constraints as Polynomials</h3>
                <p>
                    Your program has <strong>{air.transitions.length}</strong> instructions,
                    generating <strong>{allConstraints.length}</strong> total constraints
                    (boundary + transition constraints for each step).
                </p>

                {exampleTransition && (
                    <div style={{ marginTop: '16px' }}>
                        <p>
                            For example, at <strong>step {exampleTransition.stepIndex}</strong>,
                            the instruction <code>{exampleTransition.source}</code> creates this constraint:
                        </p>
                        <div style={{
                            margin: '16px 0',
                            padding: '16px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            borderLeft: '4px solid var(--accent-primary)'
                        }}>
                            <div style={{ color: 'var(--accent-secondary)', marginBottom: '8px' }}>
                                Constraint at step {exampleTransition.stepIndex}:
                            </div>
                            <code style={{ color: 'var(--accent-primary)' }}>
                                {exampleTransition.constraint.expr}
                            </code>
                            <div style={{ marginTop: '12px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                {exampleTransition.constraint.why}
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                Current value: <span style={{
                                    color: exampleTransition.constraint.eval() === 0
                                        ? 'var(--accent-success)'
                                        : 'var(--accent-error)',
                                    fontWeight: 'bold'
                                }}>
                                    {exampleTransition.constraint.eval()}
                                </span>
                                {exampleTransition.constraint.eval() === 0 && ' (satisfied!)'}
                            </div>
                        </div>
                    </div>
                )}

                <p style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    Each step also has constraints for registers that don't change, pc incrementing, etc.
                    See <Link to="/composition-details" style={{ color: 'var(--accent-primary)' }}>Composition Details</Link> for all constraints.
                </p>
            </div>

            {/* Step 2: Random combination */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Step 2: Random Linear Combination</h3>
                <p>
                    The verifier provides random coefficients α₀, α₁, α₂, ... (via Fiat-Shamir).
                    We combine all constraints:
                </p>
                <div style={{
                    margin: '16px 0',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    fontSize: '1.1em'
                }}>
                    H(x) = α₀·C₀(x) + α₁·C₁(x) + α₂·C₂(x) + ... + α<sub>{allConstraints.length - 1}</sub>·C<sub>{allConstraints.length - 1}</sub>(x)
                </div>
                <p>
                    <strong>Why random weights?</strong> If even one constraint C<sub>i</sub>(x) ≠ 0,
                    the random α<sub>i</sub> makes it extremely unlikely that the terms cancel out.
                    A cheating prover can't predict the alphas in advance.
                </p>
            </div>

            {/* Main visualization */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Result: Composition Polynomial H(x)</h3>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PolynomialGraph
                        values={hValues}
                        width={600}
                        height={200}
                        color={combinedValue === 0 ? 'var(--accent-success)' : 'var(--accent-error)'}
                    />
                </div>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    {combinedValue === 0 ? (
                        <div style={{ color: 'var(--accent-success)', fontWeight: 'bold', fontSize: '1.1em' }}>
                            H(x) = 0 at all {trace.length} trace points — all constraints satisfied!
                        </div>
                    ) : (
                        <div style={{ color: 'var(--accent-error)', fontWeight: 'bold', fontSize: '1.1em' }}>
                            H(x) ≠ 0 — some constraints are violated
                        </div>
                    )}
                </div>
            </div>

            {/* The quotient argument */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-secondary)' }}>
                <h3>Step 3: The Quotient Polynomial</h3>
                <p>
                    Here's the key insight: if H(x) = 0 at all {trace.length} trace points,
                    then H(x) is divisible by the <strong>vanishing polynomial</strong>:
                </p>
                <div style={{
                    margin: '16px 0',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    textAlign: 'center'
                }}>
                    Z(x) = x<sup>N</sup> - 1 &nbsp;&nbsp; (where N = {trace.length})
                </div>
                <p style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Z(x) is zero exactly at the N-th roots of unity — the points where we evaluate the trace.
                </p>

                <p>
                    The prover computes the <strong>quotient polynomial</strong>:
                </p>
                <div style={{
                    margin: '16px 0',
                    padding: '16px',
                    background: 'rgba(100, 200, 255, 0.1)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    fontSize: '1.2em',
                    border: '1px solid var(--accent-secondary)'
                }}>
                    Q(x) = H(x) / Z(x)
                </div>

                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,255,100,0.05)', borderRadius: '8px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>The magic:</strong> If H(x) is truly zero at all trace points,
                        then Q(x) is a <em>low-degree polynomial</em>.
                        If even one constraint fails, H(x) won't divide evenly,
                        and Q(x) will have high degree or won't be a polynomial at all.
                    </p>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(100, 200, 255, 0.1)', borderRadius: '8px', fontSize: '0.9em' }}>
                    <strong>Second Commitment:</strong> Just like the trace, the prover evaluates Q(x) on the LDE domain
                    and commits to those values via a Merkle root. This is the <em>quotient commitment</em> sent to the verifier.
                </div>
            </div>

            {/* What's next */}
            <div className="card" style={{ marginTop: '32px', background: 'rgba(255,255,255,0.02)' }}>
                <h3>What's Next?</h3>
                <p>
                    The prover has now sent two commitments: the <strong>trace LDE</strong> and the <strong>quotient LDE</strong>.
                    Now we need to prove Q(x) is low-degree. That's what <strong>FRI</strong> does —
                    it's an efficient protocol to verify polynomial degree without revealing the whole polynomial.
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <Link to="/composition-details" className="btn btn-ghost">
                        View All Constraints →
                    </Link>
                    <Link to="/fri" className="button">
                        Continue to FRI →
                    </Link>
                </div>
            </div>
        </div>
    );
}
