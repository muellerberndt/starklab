import { useMemo } from 'react';
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
                The prover combines all {allConstraints.length} constraints into a single <strong>composition polynomial</strong> H(x).
            </p>

            {/* Main visualization */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Composition Polynomial H(x)</h3>
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
                            H(x) = 0 at all trace points — all constraints satisfied!
                        </div>
                    ) : (
                        <div style={{ color: 'var(--accent-error)', fontWeight: 'bold', fontSize: '1.1em' }}>
                            H(x) ≠ 0 — some constraints are violated
                        </div>
                    )}
                </div>
            </div>

            {/* How it works */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>How It Works</h3>
                <p>
                    Each AIR constraint (like <code>r1' = r0 + r1</code>) becomes a polynomial equation using the trace polynomials:
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontFamily: 'monospace', textAlign: 'center' }}>
                    C(x) = T_r1(x+1) - T_r0(x) - T_r1(x)
                </div>
                <p>
                    The verifier sends random coefficients α₀, α₁, ... and the prover computes:
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontFamily: 'monospace', textAlign: 'center' }}>
                    H(x) = α₀·C₀(x) + α₁·C₁(x) + α₂·C₂(x) + ...
                </div>
                <p style={{ marginTop: '16px' }}>
                    If all constraints equal 0, then H(x) = 0 at all trace points.
                    The random alphas ensure a cheating prover can't make non-zero terms cancel out.
                </p>
            </div>

            {/* The key insight */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-secondary)' }}>
                <h3>The Quotient Polynomial</h3>
                <p>
                    If H(x) = 0 at all N trace points (x = 0, 1, ..., N-1), then H(x) is divisible by the <strong>vanishing polynomial</strong>:
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontFamily: 'monospace', textAlign: 'center' }}>
                    Z(x) = (x - 0)(x - 1)(x - 2)...(x - (N-1)) = x^N - 1
                </div>
                <p>
                    The prover computes the <strong>quotient polynomial</strong>:
                </p>
                <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontFamily: 'monospace', textAlign: 'center' }}>
                    Q(x) = H(x) / Z(x)
                </div>
                <p>
                    If the trace is valid, Q(x) is a low-degree polynomial. If the trace is invalid, H(x) won't be divisible by Z(x),
                    and Q(x) won't be a polynomial at all — it will have high degree or be undefined.
                </p>
                <p style={{ marginTop: '16px', fontWeight: 'bold' }}>
                    FRI (next step) proves Q(x) is low-degree, which proves all constraints are satisfied!
                </p>
            </div>

            {/* Link to details */}
            <div className="card" style={{ marginTop: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <p>Want to see the individual constraints and how they combine?</p>
                <Link to="/composition-details" className="button" style={{ marginTop: '12px', display: 'inline-block' }}>
                    View Composition Details →
                </Link>
            </div>
        </div>
    );
}
