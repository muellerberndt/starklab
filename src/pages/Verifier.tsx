
import { useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';

export function VerifierPage() {
    const { trace, air, code, failures } = useStark();
    const [checks, setChecks] = useState<{ name: string; status: 'pending' | 'pass' | 'fail'; error?: string }[]>([
        { name: 'Verify Trace Commitment (Merkle Root)', status: 'pending' },
        { name: 'Verify Constraint Degree', status: 'pending' },
        { name: 'Verify FRI Layer 0', status: 'pending' },
        { name: 'Verify FRI Layer 1', status: 'pending' },
        { name: 'Verify FRI Final Value', status: 'pending' },
    ]);
    const [isVerifying, setIsVerifying] = useState(false);

    const runVerification = () => {
        setIsVerifying(true);

        // Reset checks
        setChecks(c => c.map(x => ({ ...x, status: 'pending', error: undefined })));

        // Simulate verification steps with delays
        checks.forEach((_, i) => {
            setTimeout(() => {
                setChecks(prev => {
                    const newChecks = [...prev];

                    // REAL LOGIC:
                    // 1. If we have no trace/air/code, everything fails.
                    if (trace.length === 0 || !air || code.length === 0) {
                        newChecks[i].status = 'fail';
                        newChecks[i].error = "Missing proof data";
                        return newChecks;
                    }

                    // 2. If we have constraint failures, the "Verify Constraint Degree" step fails.
                    // (In a real STARK, this would be the "Consistency Check" or "DEEP-ALI" check)
                    if (failures.length > 0) {
                        // Let the first step pass (Commitment), but fail the second (Constraints)
                        if (i === 0) {
                            newChecks[i].status = 'pass';
                        } else {
                            newChecks[i].status = 'fail';
                            if (i === 1) {
                                newChecks[i].error = `Constraints violated! Found ${failures.length} errors.`;
                            } else {
                                newChecks[i].error = "Dependent check failed";
                            }
                        }
                    } else {
                        // If no failures, everything passes!
                        newChecks[i].status = 'pass';
                    }

                    return newChecks;
                });

                if (i === checks.length - 1) {
                    setIsVerifying(false);
                }
            }, (i + 1) * 800);
        });
    };

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Proof Check (Verifier)</h1>
            <p>
                You are now the <strong>Verifier</strong>. The Prover has sent you a proof.
                It's time to check if it's valid!
            </p>

            <Explainer title="What is the Verifier doing?">
                <p>
                    The Verifier doesn't run the program. Instead, they check the <strong>Proof</strong>:
                </p>
                <ul>
                    <li><strong>Commitments:</strong> Check that the Merkle Roots match.</li>
                    <li><strong>Queries:</strong> Ask for specific values from the trace and check constraints.</li>
                    <li><strong>FRI:</strong> Check that the polynomial folding was done correctly.</li>
                </ul>
                <p>
                    If all checks pass, we can be 99.99% sure the computation was correct, without ever running it!
                </p>
            </Explainer>

            <div className="card" style={{ marginTop: '32px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                    <button
                        className="button"
                        onClick={runVerification}
                        disabled={isVerifying}
                    >
                        {isVerifying ? 'Verifying...' : 'Run Verification'}
                    </button>
                </div>

                <div className="card">
                    <h3>Verification Steps</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {checks.map((check, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${check.status === 'pass' ? 'var(--accent-success)' :
                                    check.status === 'fail' ? 'var(--accent-error)' :
                                        'var(--text-muted)'
                                    }`
                            }}>
                                <span style={{ fontSize: '1.1em' }}>{check.name}</span>
                                <span>
                                    {check.status === 'pending' && <span className="muted">Pending...</span>}
                                    {check.status === 'pass' && <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>PASS</span>}
                                    {check.status === 'fail' && (
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ color: 'var(--accent-error)', fontWeight: 'bold' }}>FAIL</span>
                                            <div style={{ fontSize: '0.8em', color: 'var(--accent-error)' }}>{check.error}</div>
                                        </div>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>

                    {checks.every(c => c.status !== 'pending') && (
                        <div style={{ marginTop: '32px', textAlign: 'center', padding: '32px', background: checks.every(c => c.status === 'pass') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
                            {checks.every(c => c.status === 'pass') ? (
                                <h2 style={{ color: 'var(--accent-success)', margin: 0 }}>Proof Accepted!</h2>
                            ) : (
                                <div>
                                    <h2 style={{ color: 'var(--accent-error)', margin: 0 }}>Proof Rejected!</h2>
                                    <p style={{ marginTop: '8px' }}>The Verifier detected an invalid trace.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="card" style={{ marginTop: '32px' }}>
                    <h3>Deep Dive: The Arithmetic</h3>
                    <p>
                        This is the core algebraic idea behind STARK verification: if the constraints vanish on the trace domain, then the constraint polynomial $C(x)$ is divisible by the vanishing polynomial $Z(x)$.
                    </p>
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '24px',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '16px',
                        border: failures.length > 0 ? '1px solid var(--accent-error)' : '1px solid var(--accent-success)'
                    }}>
                        <div style={{ textAlign: 'center', fontSize: '1.2em', marginBottom: '16px', fontStyle: 'italic' }}>
                            C(x) / Z(x) = Q(x)
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
                            <div>
                                <div style={{ color: failures.length > 0 ? 'var(--accent-error)' : 'var(--accent-success)', fontSize: '1.5em', fontWeight: 'bold' }}>
                                    {failures.length > 0 ? failures[0].value : '0'}
                                </div>
                                <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Constraint Value</div>
                            </div>
                            <div style={{ fontSize: '1.5em' }}>/</div>
                            <div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '1.5em', fontWeight: 'bold' }}>
                                    Z(x)
                                </div>
                                <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Target Poly</div>
                            </div>
                            <div style={{ fontSize: '1.5em' }}>=</div>
                            <div>
                                <div style={{ color: failures.length > 0 ? 'var(--accent-error)' : 'var(--accent-success)', fontSize: '1.1em', fontWeight: 'bold' }}>
                                    {failures.length > 0 ? 'High Degree!' : 'Low Degree'}
                                </div>
                                <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Quotient</div>
                            </div>
                        </div>

                        {failures.length > 0 && (
                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '4px', fontSize: '0.9em', color: 'var(--accent-error)' }}>
                                <strong>Verification Failed:</strong> A non-zero constraint at some step (e.g. {failures[0].value}) means $C(x)$ does not vanish on the trace domain, so the divisibility check fails.
                            </div>
                        )}
                        {failures.length === 0 && (
                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,255,0,0.1)', borderRadius: '4px', fontSize: '0.9em', color: 'var(--accent-success)' }}>
                                <strong>Verification Passed:</strong> All constraints are 0 on the trace, so the division by $Z(x)$ is clean and the quotient is a valid low-degree polynomial.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
