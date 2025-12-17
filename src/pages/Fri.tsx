import { useState, useEffect } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';



export function FriPage() {
    const { trace } = useStark();
    const [layers, setLayers] = useState<number[][]>([]);
    const [currentLayer, setCurrentLayer] = useState(0);

    useEffect(() => {
        if (trace.length > 0) {
            // Simulate FRI layers
            // Layer 0: The trace values (simplified, just take first column)
            const layer0 = trace.map(r => r.regs['r0'] ?? 0);

            // Pad to power of 2 if needed
            while (layer0.length & (layer0.length - 1)) {
                layer0.push(0);
            }

            const allLayers = [layer0];
            let current = layer0;

            // Fold until we have 1 value
            while (current.length > 1) {
                const next = [];
                for (let i = 0; i < current.length; i += 2) {
                    // Simple folding: (a + b) / 2 (mock logic)
                    // In reality, it's P(x) + beta * P(-x)
                    const val = Math.floor((current[i] + current[i + 1]) / 2);
                    next.push(val);
                }
                allLayers.push(next);
                current = next;
            }
            setLayers(allLayers);
        }
    }, [trace]);

    const nextLayer = () => {
        if (currentLayer < layers.length - 1) {
            setCurrentLayer(c => c + 1);
        }
    };

    const reset = () => setCurrentLayer(0);

    if (trace.length === 0) {
        return (
            <div className="container">
                <h1>4. FRI Protocol</h1>
                <div className="alert error">
                    No trace found! Please go back to the <strong>Trace</strong> page.
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>4. FRI Protocol</h1>
            <p>
                <strong>Fast Reed-Solomon Interactive Oracle Proof of Proximity</strong> (FRI) is how we prove the polynomial has a "low degree" without sending the whole thing.
            </p>

            <Explainer title="The Folding Scheme">
                <p>
                    Imagine a long list of numbers (our polynomial evaluated on a domain).
                    We want to shrink this list by half at each step.
                </p>
                <p>
                    The Verifier sends a random number <code>β</code>. We use it to "fold" pairs of values into one:
                    <code>NewVal = A + β·B</code>.
                </p>
                <p>
                    We repeat this until only one value remains. If the original list came from a low-degree polynomial,
                    the final value will satisfy a specific check.
                </p>
            </Explainer>

            <div className="card" style={{ marginTop: '32px', textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3>FRI Layer {currentLayer}</h3>
                    <p className="muted">
                        {currentLayer === 0
                            ? "Original Domain (Trace Values)"
                            : `Folded Domain (Size: ${layers[currentLayer]?.length})`}
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    minHeight: '100px'
                }}>
                    {layers[currentLayer]?.map((val, i) => (
                        <div key={i} style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            fontSize: '0.9em'
                        }}>
                            {val}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <button
                        className="btn btn-ghost"
                        onClick={reset}
                        disabled={currentLayer === 0}
                    >
                        Reset
                    </button>
                    <button
                        className="button"
                        onClick={nextLayer}
                        disabled={currentLayer >= layers.length - 1}
                    >
                        {currentLayer >= layers.length - 1 ? "Done" : "Fold Next Layer ↓"}
                    </button>
                </div>

                {currentLayer >= layers.length - 1 && (
                    <div style={{ marginTop: '16px', color: 'var(--accent-success)', fontWeight: 'bold' }}>
                        Folding Complete! The Verifier checks this final value.
                    </div>
                )}
            </div>
            <div className="card" style={{ marginTop: '64px', border: '1px solid var(--accent-secondary)' }}>
                <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0 }}>Why "Low Degree"?</h3>
                <p>
                    This is the magic step. How does "Low Degree" prove the trace is correct?
                </p>
                <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>
                        <strong>Trace as Polynomials:</strong> We turn the columns of the trace into polynomials $T(x)$.
                        <br />
                        <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>(e.g., if Trace[0]=1, then T(0)=1).</span>
                    </li>
                    <li>
                        <strong>Constraints as Polynomials:</strong> We apply the constraints to these polynomials.
                        <br />
                        <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>$C(x) = T(x+1) - (T(x) + T(x))$</span>
                    </li>
                    <li>
                        <strong>The Check:</strong> If the trace is valid, $C(x)$ must be <strong>ZERO</strong> for every step $x$.
                    </li>
                    <li>
                        <strong>The Division:</strong> If $C(x)$ is zero at all steps, it can be cleanly divided by a "Target Polynomial" $Z(x)$.
                    </li>
                    <li>
                        <strong>Result:</strong> $Q(x) = C(x) / Z(x)$ will be a <strong>Low Degree Polynomial</strong>.
                        <br />
                        <span style={{ color: 'var(--accent-error)' }}>If the trace was wrong (even once), $Q(x)$ would be huge (High Degree).</span>
                    </li>
                </ol>
                <p style={{ marginTop: '16px', fontWeight: 'bold' }}>
                    So: Proving $Q(x)$ is Low Degree $\iff$ Proving the Trace is Valid.
                </p>
            </div>
        </div>
    );
}
