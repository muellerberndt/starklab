import { useState, useMemo } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
import { TraceTable } from '../components/TraceTable';
import { Link } from 'react-router-dom';

export function ZkPage() {
    const { trace, regNames } = useStark();
    const [isZkMode, setIsZkMode] = useState(false);

    // Get actual values from trace to show what would be hidden
    const sensitiveData = useMemo(() => {
        if (trace.length === 0) return null;

        // Find the final values (what the computation produced)
        const finalRow = trace[trace.length - 1];
        const initialRow = trace[0];

        return {
            initialValues: regNames.map(r => ({ reg: r, value: initialRow.regs[r] ?? 0 })),
            finalValues: regNames.map(r => ({ reg: r, value: finalRow.regs[r] ?? 0 })),
            intermediateCount: trace.length - 2,
        };
    }, [trace, regNames]);

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
                So far, our STARK proves the computation is correct — but the verifier
                can see everything! For true zero-knowledge, we need to hide the trace.
            </p>

            <Explainer title="What the Verifier Learns">
                <p>
                    In our current implementation, the proof includes the full LDE of the trace.
                    A verifier (or anyone with the proof) could reconstruct:
                </p>
                <ul>
                    <li>All intermediate computation steps</li>
                    <li>The specific values in each register at each step</li>
                    <li>The exact execution path of the program</li>
                </ul>
                <p style={{ marginTop: '12px' }}>
                    <strong>Zero-knowledge</strong> means: the verifier learns only that the computation
                    is valid — nothing about the actual values.
                </p>
            </Explainer>

            {/* What's exposed in your trace */}
            {sensitiveData && (
                <div className="card" style={{ marginTop: '32px' }}>
                    <h3>Your Trace: What's Currently Exposed</h3>
                    <p>
                        Your {trace.length}-step computation reveals:
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginTop: '16px'
                    }}>
                        <div style={{
                            padding: '16px',
                            background: 'rgba(255, 100, 100, 0.1)',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--accent-error)'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0' }}>Initial State</h4>
                            {sensitiveData.initialValues.filter(v => v.value !== 0).length > 0 ? (
                                sensitiveData.initialValues.filter(v => v.value !== 0).map(v => (
                                    <div key={v.reg} style={{ fontFamily: 'monospace' }}>
                                        {v.reg} = {v.value}
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: 'var(--text-muted)' }}>All zeros</div>
                            )}
                        </div>

                        <div style={{
                            padding: '16px',
                            background: 'rgba(255, 100, 100, 0.1)',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--accent-error)'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0' }}>Final Result</h4>
                            {sensitiveData.finalValues.map(v => (
                                <div key={v.reg} style={{ fontFamily: 'monospace' }}>
                                    {v.reg} = {v.value}
                                </div>
                            ))}
                        </div>

                        <div style={{
                            padding: '16px',
                            background: 'rgba(255, 100, 100, 0.1)',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--accent-error)'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0' }}>Intermediate Steps</h4>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                                {sensitiveData.intermediateCount}
                            </div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                All visible to verifier
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive trace view */}
            <div className="card" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0 }}>Trace Visibility</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={!isZkMode ? '' : 'muted'}>Transparent</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
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
                                    position: 'absolute', height: '16px', width: '16px',
                                    left: isZkMode ? '26px' : '4px', bottom: '4px', backgroundColor: 'white',
                                    transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                        <span className={isZkMode ? '' : 'muted'} style={{
                            color: isZkMode ? 'var(--accent-primary)' : undefined,
                            fontWeight: isZkMode ? 'bold' : 'normal'
                        }}>
                            Zero-Knowledge
                        </span>
                    </div>
                </div>

                <TraceTable trace={trace} regNames={regNames} maskValues={isZkMode} />

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    {isZkMode ? (
                        <div style={{ color: 'var(--accent-success)' }}>
                            <strong>ZK Mode:</strong> Values are hidden. The verifier only learns that
                            a valid trace exists — not what it contains.
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)' }}>
                            Toggle to see how zero-knowledge would hide the data.
                        </div>
                    )}
                </div>
            </div>

            {/* How ZK-STARKs achieve this */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-secondary)' }}>
                <h3>How Real ZK-STARKs Hide Data</h3>
                <p>
                    Production ZK-STARKs use <strong>blinding</strong> to hide trace values:
                </p>

                <div style={{ marginTop: '16px' }}>
                    <div style={{
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-secondary)' }}>
                            1. Random Blinding Polynomials
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9em' }}>
                            Add random low-degree polynomials to each trace column.
                            The constraints still verify (because they're linear),
                            but the actual values are masked.
                        </p>
                    </div>

                    <div style={{
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-secondary)' }}>
                            2. Commitment Before Challenges
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9em' }}>
                            The prover commits to the blinded trace <em>before</em> seeing
                            the verifier's random challenges. This prevents the prover from
                            crafting values that leak information.
                        </p>
                    </div>

                    <div style={{
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-secondary)' }}>
                            3. Limited Openings
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9em' }}>
                            Only a few random positions are opened for verification.
                            With proper blinding, each opened value looks uniformly random
                            and reveals nothing about the original trace.
                        </p>
                    </div>
                </div>
            </div>

            {/* What this implementation does/doesn't do */}
            <div className="card" style={{ marginTop: '32px', background: 'rgba(255, 180, 100, 0.05)' }}>
                <h3>This Implementation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <h4 style={{ color: 'var(--accent-error)', margin: '0 0 8px 0' }}>Not Implemented</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9em' }}>
                            <li>Blinding polynomials</li>
                            <li>Zero-knowledge property</li>
                            <li>Private inputs</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--accent-success)', margin: '0 0 8px 0' }}>Implemented</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9em' }}>
                            <li>Succinctness (small proof)</li>
                            <li>Soundness (can't fake proofs)</li>
                            <li>Non-interactivity (Fiat-Shamir)</li>
                        </ul>
                    </div>
                </div>
                <p style={{ marginTop: '16px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    Adding zero-knowledge would require significant changes to the polynomial
                    commitment and constraint evaluation. For a teaching tool, we prioritize
                    clarity over privacy.
                </p>
            </div>

            {/* Use cases */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Why Zero-Knowledge Matters</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginTop: '16px'
                }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>Private Transactions</h4>
                        <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            Prove you have enough funds without revealing your balance
                        </p>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>Identity Verification</h4>
                        <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            Prove you're over 18 without revealing your birthdate
                        </p>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>Confidential Computing</h4>
                        <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            Prove a computation was correct without revealing inputs
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <Link to="/fri" className="btn btn-ghost" style={{ marginRight: '16px' }}>
                    ← Back to FRI
                </Link>
                <Link to="/verify" className="button">
                    Continue to Verification →
                </Link>
            </div>
        </div>
    );
}
