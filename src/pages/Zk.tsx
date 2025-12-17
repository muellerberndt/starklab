import { useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
import { TraceTable } from '../components/TraceTable';

export function ZkPage() {
    const { trace, regNames } = useStark();
    const [isZkMode, setIsZkMode] = useState(false);

    if (trace.length === 0) {
        return (
            <div className="container">
                <h1>5. Zero-Knowledge</h1>
                <div className="alert error">
                    No trace found! Please go back to the <strong>Trace</strong> page.
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>5. Zero-Knowledge</h1>
            <p>
                Right now, the Verifier can see our whole trace (or at least, they could if they queried every point).
                To make it <strong>Zero-Knowledge</strong>, we need to hide the original values.
            </p>

            <Explainer title="Blinding the Trace">
                <p>
                    Real zero-knowledge STARKs don’t reveal the raw trace. Instead, the Prover commits to a <strong>masked low-degree extension</strong> of the trace columns.
                </p>
                <p>
                    Intuitively: each trace column polynomial is “blinded” by adding a random low-degree mask polynomial (and adjusting constraints accordingly), so openings look random while the constraints still verify.
                </p>
                <p>
                    This page shows a <em>conceptual</em> “masked view” of the trace; the full masking construction isn’t implemented in this tutorial build.
                </p>
            </Explainer>

            <div className="card" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3>Trace with Blinding</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={!isZkMode ? 'muted' : ''}>Standard Mode</span>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                            <input
                                type="checkbox"
                                checked={isZkMode}
                                onChange={(e) => setIsZkMode(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: isZkMode ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                transition: '.4s', borderRadius: '24px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '16px', width: '16px',
                                    left: isZkMode ? '26px' : '4px', bottom: '4px', backgroundColor: 'white',
                                    transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                        <span className={isZkMode ? 'active' : 'muted'} style={{ color: isZkMode ? 'var(--accent-primary)' : undefined, fontWeight: isZkMode ? 'bold' : 'normal' }}>
                            ZK Mode
                        </span>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <TraceTable trace={trace} regNames={regNames} maskValues={isZkMode} />
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    {isZkMode ? (
                        <p>
                            The Verifier learns structure (that a valid trace exists) without learning the trace values.
                            <br />
                            <strong>Openings are meant to look random.</strong>
                        </p>
                    ) : (
                        <p className="muted">
                            Toggle ZK Mode to see how we hide the data.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
