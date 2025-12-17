
import { PolynomialGraph } from '../components/PolynomialGraph';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function ConstraintEvaluationPage() {
    // Use a static 8-step trace for the "Basics" section
    // r0: 1, 1, 2, 3, 5, 8, 13, 21
    // r1: 1, 2, 3, 5, 8, 13, 21, 34
    // We only need the values relevant for the fiber check r1_next = r0 + r1

    // Let's manually construct the trace values to match the logic perfectly
    const traceValues = [1, 1, 2, 3, 5, 8, 13, 21];

    // r0 behaves like the fib sequence starting at 1, 1
    const r0Values = traceValues;

    // r1 behaves like the fib sequence starting at 1, 2 (shifted by 1 step effectively in the standard check)
    // But for "r1_next = r0 + r1", let's assume a standard fib trace where:
    // Step 0: r0=1, r1=1
    // Step 1: r0=1, r1=2
    // Step 2: r0=2, r1=3
    // ...
    // Wait, in our DSL:
    // r2 = r0 + r1
    // r0 = r1
    // r1 = r2
    // So:
    // S0: 1, 1
    // S1: 1, 2
    // S2: 2, 3
    // S3: 3, 5
    // ...
    // So r0 is [1, 1, 2, 3, 5, 8, 13, 21]
    // And r1 is [1, 2, 3, 5, 8, 13, 21, 34]

    const r1Values = [1, 2, 3, 5, 8, 13, 21, 34];

    // Constraint values: r1(next) - (r0(curr) + r1(curr))
    const constraintValues = r0Values.slice(0, -1).map((r0, i) => {
        const r1 = r1Values[i];
        const r1Next = r1Values[i + 1];

        // Calculate diff in prime field (p=97)
        // We want (r1Next - (r0 + r1)) % 97 == 0
        const val = (r1Next - (r0 + r1)) % 97;
        return val < 0 ? val + 97 : val;
    });

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Basics III: Constraint Evaluation</h1>
            <p>
                Let's zoom in on a single constraint to see how it's constructed from the trace polynomials.
            </p>

            <div className="card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent-primary)' }}>
                <h3>What is a "Constraint"?</h3>
                <p>
                    A <strong>Constraint</strong> is just a mathematical rule that must equal <strong>Zero</strong> if the program ran correctly.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '4px', margin: '12px 0', fontFamily: 'monospace' }}>
                    Next_Register_Value - (Current_Register_Value + 1) = 0
                </div>
                <p style={{ fontSize: '0.9em' }}>
                    If this equation equals <code>0</code>, the step is valid. If it equals <code>5</code> (or anything else), someone cheated!
                    <br />
                    In STARKs, we convert these rules into <strong>Polynomials</strong>. If the polynomials evaluate to zero appropriately, the Proof holds.
                </p>
            </div>


            <p>
                We'll look at the Fibonacci transition: <code>r1_next = r0 + r1</code>.
                <br />
                (In polynomial terms: <code>P_r1(x+1) - (P_r0(x) + P_r1(x)) = 0</code>)
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
                <div className="card">
                    <h3>Input: P_r0(x) (Current)</h3>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PolynomialGraph values={r0Values.slice(0, -1)} width={600} height={150} color="var(--accent-primary)" />
                    </div>
                </div>
                <div className="card">
                    <h3>Input: P_r1(x) (Current)</h3>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PolynomialGraph values={r1Values.slice(0, -1)} width={600} height={150} color="var(--accent-secondary)" />
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', margin: '16px 0', fontWeight: 'bold' }}>+</div>
            </div>

            <div className="card">
                <h3>Sum: P_r0(x) + P_r1(x)</h3>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PolynomialGraph
                        values={r0Values.slice(0, -1).map((v, i) => v + r1Values[i])}
                        width={600}
                        height={150}
                        color="#bd93f9"
                    />
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', margin: '16px 0', fontWeight: 'bold' }}>vs</div>
            </div>

            <div className="card">
                <h3>Target: P_r1(x+1) (Next)</h3>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PolynomialGraph values={r1Values.slice(1)} width={600} height={150} color="#ff79c6" />
                </div>
            </div>

            <div className="card" style={{ marginTop: '32px', border: '2px solid var(--accent-success)' }}>
                <h3>Result: Constraint Polynomial C(x)</h3>
                <p style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <code>C(x) = P_r1(x+1) - (P_r0(x) + P_r1(x))</code>
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PolynomialGraph
                        values={constraintValues}
                        width={600}
                        height={200}
                        color={constraintValues.every(v => v === 0) ? 'var(--accent-success)' : 'var(--accent-error)'}
                    />
                </div>
                <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)' }}>
                    {constraintValues.every(v => v === 0)
                        ? "Perfectly zero! The constraint holds."
                        : "Non-zero values indicate broken constraints."}
                </p>
            </div>

            <div className="card" style={{ marginTop: '32px', border: '1px solid var(--border-color)' }}>
                <h3>Selector Columns</h3>
                <p>
                    You might be thinking: <em style={{ color: 'var(--text-muted)' }}>"Real programs aren't just one Fibonacci loop! Steps 1-5 might be ADD, Step 6 might be MULTIPLY. Do we need a different polynomial for every step?"</em>
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.9em' }}>
                        No! We use extra columns called <strong>Selectors</strong> (like simple on/off switches) to turn constraints on or off for each row.
                    </p>
                    <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '4px', margin: '12px 0' }}>
                        C(x) = <span style={{ color: 'var(--accent-primary)' }}>is_add</span> * (r2 - (r0 + r1)) +
                        <span style={{ color: 'var(--accent-secondary)' }}> is_mul</span> * (r2 - (r0 * r1))
                    </div>
                    <p style={{ fontSize: '0.9em' }}>
                        This way, we can build a universal "CPU" with a constant number of constraints (e.g., 50) that can verify a trace of <strong>any</strong> length (1,000,000+ steps)!
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px' }}>
                <Link to="/encoding" className="btn btn-ghost">
                    <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                    Back to Basics II
                </Link>
                <Link to="/protocol" className="button">
                    Next: Protocol Overview
                    <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                </Link>
            </div>
        </div>
    );
}
