import { useMemo, useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
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



export function FriPage() {
    const { trace, prime } = useStark();
    const [currentLayer, setCurrentLayer] = useState(0);

    const { layers, betas } = useMemo(() => {
        if (trace.length === 0) return { layers: [] as number[][], betas: [] as number[] };

        const layer0 = trace.map((r) => mod(r.regs['r0'] ?? 0, prime));

        // Pad to a power of 2 so we can pair elements cleanly.
        while (layer0.length & (layer0.length - 1)) {
            layer0.push(0);
        }

        const allLayers = [layer0];
        const allBetas: number[] = [];
        let current = layer0;
        let seed = 0x811C9DC5;
        seed = Math.imul(seed ^ prime, 16777619);
        for (const v of layer0) seed = Math.imul(seed ^ v, 16777619);
        const rand = mulberry32(seed);

        while (current.length > 1) {
            const beta = Math.floor(rand() * prime);
            allBetas.push(beta);

            const next: number[] = [];
            for (let i = 0; i < current.length; i += 2) {
                const a = current[i];
                const b = current[i + 1];
                next.push(mod(a + beta * b, prime));
            }

            allLayers.push(next);
            current = next;
        }

        return { layers: allLayers, betas: allBetas };
    }, [trace, prime]);

    const layerIndex = Math.min(currentLayer, Math.max(0, layers.length - 1));

    const nextLayer = () => {
        if (layerIndex < layers.length - 1) {
            setCurrentLayer(layerIndex + 1);
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
                <strong>Fast <a href="https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>Reed-Solomon</a> Interactive Oracle Proof of Proximity</strong> (FRI) is how we prove the polynomial has a "low degree" without sending the whole thing.
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
                    <h3>FRI Layer {layerIndex}</h3>
                    <p className="muted">
                        {layerIndex === 0
                            ? "Original Domain (Trace Values)"
                            : `Folded Domain (Size: ${layers[layerIndex]?.length})`}
                    </p>
                    {layerIndex > 0 && (
                        <p className="muted" style={{ marginTop: '8px' }}>
                            Folding challenge: <code>β = {betas[layerIndex - 1] ?? 0}</code>
                        </p>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    minHeight: '100px'
                }}>
                    {layers[layerIndex]?.map((val, i) => (
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
                        disabled={layerIndex === 0}
                    >
                        Reset
                    </button>
                    <button
                        className="button"
                        onClick={nextLayer}
                        disabled={layerIndex >= layers.length - 1}
                    >
                        {layerIndex >= layers.length - 1 ? "Done" : "Fold Next Layer ↓"}
                    </button>
                </div>

                {layerIndex >= layers.length - 1 && (
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
                        <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            {'$C(x) = T_{r2}(x+1) - (T_{r0}(x) + T_{r1}(x))$'}
                        </span>
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
