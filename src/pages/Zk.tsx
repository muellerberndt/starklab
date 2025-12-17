import { useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
import { TraceTable } from '../components/TraceTable';
import type { TraceRow } from '../core/vm';

export function ZkPage() {
    const { trace, regNames } = useStark();
    const [isZkMode, setIsZkMode] = useState(false);

    // Add random rows to the end of the trace
    const zkTrace: TraceRow[] = isZkMode ? [
        ...trace,
        { pc: 99, halted: 0, regs: { r0: 12345, r1: 67890, r2: 13579 } },
        { pc: 99, halted: 0, regs: { r0: 54321, r1: 98765, r2: 24680 } }
    ] : trace;

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
                    We add a few rows of <strong>random garbage</strong> at the end of the execution trace.
                </p>
                <p>
                    When the Verifier queries the trace, if they hit a random row, they just see noise.
                    Because the polynomial interpolation includes these random points, the <strong>entire polynomial</strong> becomes randomized.
                </p>
                <p>
                    This ensures that querying the polynomial at any point reveals <strong>nothing</strong> about the original trace values.
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
                    <TraceTable trace={zkTrace} regNames={regNames} />

                    {isZkMode && (
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            height: '80px',
                            background: 'linear-gradient(to bottom, transparent, rgba(112, 0, 255, 0.1))',
                            borderBottom: '2px solid var(--accent-primary)',
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            paddingBottom: '8px',
                            color: 'var(--accent-primary)',
                            fontWeight: 'bold'
                        }}>
                            + Blinding Rows (Random Noise)
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    {isZkMode ? (
                        <p>
                            Now the polynomial passes through these random points too.
                            <br />
                            <strong>The entire polynomial is now "blinded"!</strong>
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
