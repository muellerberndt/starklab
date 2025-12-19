import { useMemo, useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
import { prove } from '../core/prover';
import { Link } from 'react-router-dom';

export function FriPage() {
    const { trace, air, prime, regNames, failures } = useStark();
    const [currentLayer, setCurrentLayer] = useState(0);
    const [showProof, setShowProof] = useState(false);

    // Generate actual proof to get the quotient polynomial
    const proofData = useMemo(() => {
        if (trace.length === 0 || !air || failures.length > 0) return null;
        try {
            const proof = prove(trace, air, prime, regNames);
            return proof;
        } catch {
            return null;
        }
    }, [trace, air, prime, regNames, failures]);

    // FRI folding simulation on the quotient polynomial
    const { layers, betas } = useMemo(() => {
        if (!proofData) return { layers: [] as number[][], betas: [] as number[] };

        // Use actual quotient LDE values from the proof
        const quotientValues = proofData.quotientLDE;

        // Pad to power of 2 if needed
        const layer0 = [...quotientValues];
        while (layer0.length & (layer0.length - 1)) {
            layer0.push(0);
        }

        const allLayers = [layer0];
        const allBetas: number[] = [];
        let current = layer0;

        // Use proof's FRI layers for consistent betas
        for (let i = 0; i < proofData.friLayers.length && current.length > 1; i++) {
            // Derive beta from layer commitment (simplified)
            const beta = (proofData.friLayers[i].commitment.charCodeAt(0) * 7) % prime;
            allBetas.push(beta);

            const next: number[] = [];
            for (let j = 0; j < current.length; j += 2) {
                const a = current[j] ?? 0;
                const b = current[j + 1] ?? 0;
                next.push(((a + beta * b) % prime + prime) % prime);
            }

            allLayers.push(next);
            current = next;
        }

        return { layers: allLayers, betas: allBetas };
    }, [proofData, prime]);

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

    if (failures.length > 0) {
        return (
            <div className="container">
                <h1>4. FRI Protocol</h1>
                <div className="alert error">
                    Trace has constraint violations! <Link to="/trace">Fix the trace</Link> first.
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>4. FRI Protocol</h1>
            <p>
                <strong>Fast Reed-Solomon Interactive Oracle Proof of Proximity</strong> (FRI) proves
                that the quotient polynomial Q(x) has low degree — which proves all constraints are satisfied.
            </p>

            <Explainer title="Why Low Degree Matters">
                <p>
                    Recall from the Composition step: we computed Q(x) = H(x) / Z(x).
                </p>
                <p>
                    If all constraints are satisfied, H(x) = 0 at all trace points,
                    so H(x) is divisible by the vanishing polynomial Z(x).
                    The quotient Q(x) is then a <strong>low-degree polynomial</strong>.
                </p>
                <p>
                    If even one constraint fails, H(x) won't divide evenly,
                    and Q(x) would need to be high-degree (or not a polynomial at all).
                </p>
                <p style={{ marginTop: '12px', fontWeight: 'bold' }}>
                    FRI proves Q(x) is low-degree without revealing Q(x) itself!
                </p>
            </Explainer>

            {/* The actual quotient polynomial */}
            {proofData && (
                <div className="card" style={{ marginTop: '32px' }}>
                    <h3>Your Quotient Polynomial Q(x)</h3>
                    <p>
                        From your {trace.length}-row trace, we computed Q(x) = H(x) / Z(x).
                        Q(x) is evaluated on an LDE domain of size {proofData.params.ldeDomainSize}.
                    </p>

                    <div style={{ marginTop: '16px' }}>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setShowProof(!showProof)}
                            style={{ marginBottom: '12px' }}
                        >
                            {showProof ? 'Hide' : 'Show'} Q(x) Values
                        </button>

                        {showProof && (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px',
                                maxHeight: '120px',
                                overflowY: 'auto',
                                padding: '8px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                                fontSize: '0.8em',
                                fontFamily: 'monospace'
                            }}>
                                {proofData.quotientLDE.slice(0, 32).map((val, i) => (
                                    <span key={i} style={{
                                        padding: '2px 6px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '4px'
                                    }}>
                                        Q[{i}]={val}
                                    </span>
                                ))}
                                {proofData.quotientLDE.length > 32 && (
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        ... {proofData.quotientLDE.length - 32} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'rgba(0, 255, 100, 0.05)',
                        borderRadius: '8px',
                        borderLeft: '4px solid var(--accent-success)'
                    }}>
                        <strong>Degree bound:</strong> Q(x) should have degree ≤ {proofData.params.paddedTraceLength * 2 - proofData.params.paddedTraceLength}
                        (since H has degree ≤ N·d and Z has degree N)
                    </div>
                </div>
            )}

            {/* FRI Folding visualization */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>FRI Folding</h3>
                <p>
                    FRI repeatedly "folds" the polynomial in half using random challenges β.
                    If Q(x) is truly low-degree, the folded versions stay low-degree.
                </p>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h4>Layer {layerIndex} {layerIndex === 0 ? '(Original Q(x))' : `(Folded ${layerIndex}×)`}</h4>
                        <p className="muted">
                            Size: {layers[layerIndex]?.length ?? 0} values
                            {layerIndex > 0 && ` | β = ${betas[layerIndex - 1]}`}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        justifyContent: 'center',
                        marginBottom: '24px',
                        minHeight: '80px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '8px'
                    }}>
                        {layers[layerIndex]?.slice(0, 64).map((val, i) => (
                            <div key={i} style={{
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '0.75em'
                            }}>
                                {val}
                            </div>
                        ))}
                        {(layers[layerIndex]?.length ?? 0) > 64 && (
                            <div style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
                                +{(layers[layerIndex]?.length ?? 0) - 64} more
                            </div>
                        )}
                    </div>

                    {layerIndex > 0 && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '0.9em'
                        }}>
                            Folding: Q'[i] = Q[i] + β · Q[i + n/2]
                        </div>
                    )}

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
                            {layerIndex >= layers.length - 1 ? "Folding Complete!" : "Fold Next Layer ↓"}
                        </button>
                    </div>

                    {layerIndex >= layers.length - 1 && layers.length > 0 && (
                        <div style={{ marginTop: '16px', color: 'var(--accent-success)', fontWeight: 'bold' }}>
                            Final value: {layers[layerIndex]?.[0]}
                            <div style={{ fontSize: '0.9em', fontWeight: 'normal', marginTop: '4px' }}>
                                The verifier checks this matches the claimed constant polynomial.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Why this works */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-secondary)' }}>
                <h3>Why FRI Proves Low Degree</h3>
                <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>
                        <strong>Honest prover:</strong> Q(x) has degree d. After folding with random β,
                        the new polynomial has degree d/2. After log(d) folds, we get a constant.
                    </li>
                    <li>
                        <strong>Cheating prover:</strong> If Q(x) had high degree (because constraints failed),
                        folding won't reduce the degree properly. The final "constant" won't match
                        what the verifier expects.
                    </li>
                    <li>
                        <strong>Verification:</strong> The verifier spot-checks a few random positions
                        to ensure the folding was done correctly. If even one position is wrong,
                        the prover is caught with high probability.
                    </li>
                </ol>
            </div>

            {/* Connection to the proof */}
            <div className="card" style={{ marginTop: '32px', background: 'rgba(255,255,255,0.02)' }}>
                <h3>In Your Proof</h3>
                {proofData ? (
                    <div>
                        <p>The prover generated:</p>
                        <ul style={{ marginTop: '8px' }}>
                            <li><strong>{proofData.friLayers.length}</strong> FRI layers (halving each time)</li>
                            <li><strong>{proofData.params.numQueries}</strong> random query positions to verify</li>
                            <li>Final value: <code>{proofData.friFinalValue}</code></li>
                        </ul>
                        <p style={{ marginTop: '16px' }}>
                            The verifier will check that each query position folds correctly through all layers.
                        </p>
                    </div>
                ) : (
                    <p className="muted">Could not generate proof for current trace.</p>
                )}
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <Link to="/composition" className="btn btn-ghost" style={{ marginRight: '16px' }}>
                    ← Back to Composition
                </Link>
                <Link to="/verify" className="button">
                    Run Full Verification →
                </Link>
            </div>
        </div>
    );
}
