import { useState } from 'react';
import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
import { prove, type ToyStarkProof } from '../core/prover';
import { verify, type VerificationStep } from '../core/verifier';

export function VerifierPage() {
    const { trace, air, prime, regNames, failures } = useStark();
    const [proof, setProof] = useState<ToyStarkProof | null>(null);
    const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [proofError, setProofError] = useState<string | null>(null);

    const canGenerateProof = trace.length > 0 && air !== null && failures.length === 0;

    const generateProof = () => {
        if (!air) return;
        setIsGenerating(true);
        setProofError(null);
        setVerificationSteps([]);
        setCurrentStep(-1);

        // Small delay for UI feedback
        setTimeout(() => {
            try {
                const newProof = prove(trace, air, prime, regNames, {
                    blowup: 4,
                    numQueries: 4,
                });
                setProof(newProof);
                setIsGenerating(false);
            } catch (e) {
                setProofError(e instanceof Error ? e.message : String(e));
                setProof(null);
                setIsGenerating(false);
            }
        }, 100);
    };

    const runVerification = () => {
        if (!proof) return;

        setIsVerifying(true);
        setCurrentStep(0);

        const result = verify(proof);

        // Animate through steps
        result.steps.forEach((_, i) => {
            setTimeout(() => {
                setVerificationSteps(result.steps.slice(0, i + 1));
                setCurrentStep(i);

                if (i === result.steps.length - 1) {
                    setIsVerifying(false);
                }
            }, (i + 1) * 600);
        });
    };

    const isValid = verificationSteps.length > 0 && verificationSteps.every(s => s.status === 'pass');

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Proof Verification</h1>
            <p>
                Generate a real STARK proof and verify it step by step.
                This demonstrates how a verifier can check a computation
                <strong> without re-executing it</strong>.
            </p>

            <Explainer title="How STARK Verification Works">
                <p>
                    The verifier performs these key checks:
                </p>
                <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>
                        <strong>Commitment Check:</strong> Verify the prover committed to
                        specific polynomials before seeing the challenges.
                    </li>
                    <li>
                        <strong>Fiat-Shamir:</strong> Re-derive the random challenges from
                        the transcript to ensure the prover couldn't cheat.
                    </li>
                    <li>
                        <strong>Query Verification:</strong> At a few random points, check
                        that <code>H(x) = Q(x) × Z(x)</code>. This confirms the constraint
                        polynomial is divisible by the vanishing polynomial.
                    </li>
                    <li>
                        <strong>FRI Check:</strong> Verify the quotient polynomial has low
                        degree by checking the folding consistency.
                    </li>
                </ol>
                <p style={{ marginTop: '16px', fontStyle: 'italic' }}>
                    If all checks pass, we're convinced the original computation was correct
                    with overwhelming probability!
                </p>
            </Explainer>

            {/* Status Banner */}
            {failures.length > 0 && (
                <div className="alert error" style={{ marginTop: '24px' }}>
                    <strong>Invalid Trace:</strong> The current trace has {failures.length} constraint violation(s).
                    Fix the trace or reset it before generating a proof.
                </div>
            )}

            {proofError && (
                <div className="alert error" style={{ marginTop: '24px' }}>
                    <strong>Proof Generation Failed:</strong> {proofError}
                </div>
            )}

            {/* Step 1: Generate Proof */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h2>Step 1: Generate Proof</h2>
                <p className="muted">
                    The prover computes a proof from the execution trace. This involves:
                    computing the Low-Degree Extension (LDE), building the constraint and
                    quotient polynomials, and running the FRI protocol.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                    <button
                        className="button"
                        onClick={generateProof}
                        disabled={!canGenerateProof || isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate STARK Proof'}
                    </button>
                </div>

                {proof && (
                    <div style={{ marginTop: '24px' }}>
                        <h3>Proof Generated</h3>
                        <ProofSummary proof={proof} />
                    </div>
                )}
            </div>

            {/* Step 2: Verify Proof */}
            {proof && (
                <div className="card" style={{ marginTop: '32px' }}>
                    <h2>Step 2: Verify Proof</h2>
                    <p className="muted">
                        The verifier checks the proof without access to the original trace.
                        Watch each verification step execute.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                        <button
                            className="button"
                            onClick={runVerification}
                            disabled={isVerifying || verificationSteps.length > 0}
                        >
                            {isVerifying ? 'Verifying...' : verificationSteps.length > 0 ? 'Verification Complete' : 'Run Verification'}
                        </button>
                    </div>

                    {/* Verification Steps */}
                    {verificationSteps.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <h3>Verification Steps</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {verificationSteps.map((step, i) => (
                                    <VerificationStepCard
                                        key={i}
                                        step={step}
                                        isActive={i === currentStep && isVerifying}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Final Result */}
                    {!isVerifying && verificationSteps.length > 0 && (
                        <div style={{
                            marginTop: '32px',
                            padding: '24px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            background: isValid ? 'rgba(0, 255, 100, 0.1)' : 'rgba(255, 50, 50, 0.1)',
                            border: `2px solid ${isValid ? 'var(--accent-success)' : 'var(--accent-error)'}`,
                        }}>
                            {isValid ? (
                                <>
                                    <h2 style={{ color: 'var(--accent-success)', margin: 0 }}>
                                        Proof Accepted!
                                    </h2>
                                    <p style={{ marginTop: '12px', marginBottom: 0 }}>
                                        The verifier is convinced the computation is correct.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ color: 'var(--accent-error)', margin: 0 }}>
                                        Proof Rejected!
                                    </h2>
                                    <p style={{ marginTop: '12px', marginBottom: 0 }}>
                                        The proof failed verification. The prover may have cheated!
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Educational Deep Dive */}
            {proof && verificationSteps.length > 0 && (
                <div className="card" style={{ marginTop: '32px' }}>
                    <h2>Deep Dive: The Math</h2>
                    <QueryDetailView proof={proof} />
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function ProofSummary({ proof }: { proof: ToyStarkProof }) {
    const { params } = proof;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
        }}>
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                <div className="muted" style={{ fontSize: '0.85em' }}>Trace Length</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {params.traceLength} → {params.paddedTraceLength}
                </div>
                <div className="muted" style={{ fontSize: '0.8em' }}>padded to power of 2</div>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                <div className="muted" style={{ fontSize: '0.85em' }}>LDE Domain</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {params.ldeDomainSize}
                </div>
                <div className="muted" style={{ fontSize: '0.8em' }}>
                    {params.paddedTraceLength} × {params.blowup} blowup
                </div>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                <div className="muted" style={{ fontSize: '0.85em' }}>Queries</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {params.numQueries}
                </div>
                <div className="muted" style={{ fontSize: '0.8em' }}>random checks</div>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                <div className="muted" style={{ fontSize: '0.85em' }}>FRI Layers</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {proof.friLayers.length}
                </div>
                <div className="muted" style={{ fontSize: '0.8em' }}>folding rounds</div>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', gridColumn: 'span 2' }}>
                <div className="muted" style={{ fontSize: '0.85em' }}>Commitments</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em', marginTop: '8px' }}>
                    <div>Trace: <code>{proof.traceCommitment}</code></div>
                    <div>Quotient: <code>{proof.quotientCommitment}</code></div>
                </div>
            </div>
        </div>
    );
}

function VerificationStepCard({
    step,
    isActive,
}: {
    step: VerificationStep;
    isActive: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    const statusColor = step.status === 'pass' ? 'var(--accent-success)' :
        step.status === 'fail' ? 'var(--accent-error)' :
            'var(--text-muted)';

    const statusIcon = step.status === 'pass' ? '✓' :
        step.status === 'fail' ? '✗' :
            '○';

    return (
        <div
            style={{
                padding: '16px',
                borderRadius: '8px',
                background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                borderLeft: `4px solid ${statusColor}`,
                transition: 'all 0.3s ease',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: step.data ? 'pointer' : 'default',
                }}
                onClick={() => step.data && setExpanded(!expanded)}
            >
                <div>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: statusColor }}>{statusIcon}</span>
                        {step.name}
                    </div>
                    <div className="muted" style={{ fontSize: '0.9em', marginTop: '4px' }}>
                        {step.description}
                    </div>
                    {step.details && (
                        <div style={{
                            fontSize: '0.85em',
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono)',
                        }}>
                            {step.details}
                        </div>
                    )}
                </div>

                {step.data && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
                        {expanded ? '▼' : '▶'}
                    </span>
                )}
            </div>

            {expanded && step.data && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    fontSize: '0.85em',
                }}>
                    <StepDataView step={step} />
                </div>
            )}
        </div>
    );
}

function StepDataView({ step }: { step: VerificationStep }) {
    const data = step.data;
    if (!data) return null;

    // Special rendering for query results
    if (step.name === 'Query Opening Verification' && data.queryResults) {
        const results = data.queryResults as Array<{
            index: number;
            H: number;
            Q: number;
            Z: number;
            product: number;
            match: boolean;
        }>;

        return (
            <div>
                <div style={{ marginBottom: '12px', color: 'var(--accent-secondary)' }}>
                    Query Results (checking H = Q × Z):
                </div>
                <table style={{ width: '100%', fontSize: '0.9em' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '8px' }}>Index</th>
                            <th style={{ padding: '8px' }}>H(x)</th>
                            <th style={{ padding: '8px' }}>Q(x)</th>
                            <th style={{ padding: '8px' }}>Z(x)</th>
                            <th style={{ padding: '8px' }}>Q×Z</th>
                            <th style={{ padding: '8px' }}>Match</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{r.index}</td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{r.H}</td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{r.Q}</td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{r.Z}</td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{r.product}</td>
                                <td style={{ padding: '8px' }}>
                                    <span style={{ color: r.match ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                                        {r.match ? '✓' : '✗'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Generic data display
    return (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(data, null, 2)}
        </pre>
    );
}

function QueryDetailView({ proof }: { proof: ToyStarkProof }) {
    const [selectedQuery, setSelectedQuery] = useState(0);
    const query = proof.queryOpenings[selectedQuery];

    if (!query) return null;

    return (
        <div>
            <p className="muted">
                The core STARK check: at random query points, verify that
                the constraint polynomial <code>H(x)</code> equals the quotient <code>Q(x)</code>
                times the vanishing polynomial <code>Z(x)</code>.
            </p>

            <div style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
                {proof.queryOpenings.map((_, i) => (
                    <button
                        key={i}
                        className={i === selectedQuery ? 'button' : 'btn btn-ghost'}
                        onClick={() => setSelectedQuery(i)}
                        style={{ minWidth: '80px' }}
                    >
                        Query {i + 1}
                    </button>
                ))}
            </div>

            <div className="card" style={{ background: 'rgba(0,0,0,0.3)', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>
                    Query at LDE index {query.ldeIndex}
                </h4>

                <div style={{ display: 'grid', gap: '24px' }}>
                    {/* The equation */}
                    <div style={{
                        textAlign: 'center',
                        padding: '24px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                    }}>
                        <div style={{ fontSize: '1.4em', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: 'var(--accent-primary)' }}>H({query.ldeIndex})</span>
                            {' = '}
                            <span style={{ color: 'var(--accent-secondary)' }}>Q({query.ldeIndex})</span>
                            {' × '}
                            <span style={{ color: 'var(--accent-tertiary)' }}>Z({query.ldeIndex})</span>
                        </div>
                        <div style={{ fontSize: '1.6em', fontFamily: 'var(--font-mono)', marginTop: '12px' }}>
                            <span style={{ color: 'var(--accent-primary)' }}>{query.constraintValue}</span>
                            {' = '}
                            <span style={{ color: 'var(--accent-secondary)' }}>{query.quotientValue}</span>
                            {' × '}
                            <span style={{ color: 'var(--accent-tertiary)' }}>{query.vanishingValue}</span>
                        </div>
                        <div style={{
                            marginTop: '16px',
                            color: query.constraintValue === (query.quotientValue * query.vanishingValue) % proof.params.prime
                                ? 'var(--accent-success)'
                                : 'var(--accent-error)',
                            fontWeight: 'bold',
                        }}>
                            {query.constraintValue === (query.quotientValue * query.vanishingValue) % proof.params.prime
                                ? '✓ Equation holds!'
                                : '✗ Equation fails!'}
                        </div>
                    </div>

                    {/* Trace values at this point */}
                    <div>
                        <h5 style={{ marginBottom: '12px' }}>Trace Values at Index {query.ldeIndex}</h5>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: '8px',
                        }}>
                            {Object.entries(query.traceValues).map(([col, val]) => (
                                <div
                                    key={col}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div className="muted" style={{ fontSize: '0.8em' }}>{col}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explanation */}
                    <div style={{
                        padding: '16px',
                        background: 'rgba(var(--accent-secondary-rgb), 0.1)',
                        borderRadius: '8px',
                        borderLeft: '4px solid var(--accent-secondary)',
                    }}>
                        <strong>Why this works:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>
                                <code>Z(x) = x^N - 1</code> is zero exactly on the original trace domain.
                            </li>
                            <li>
                                If constraints are satisfied, <code>H(x)</code> is zero on trace points.
                            </li>
                            <li>
                                So <code>H(x)</code> is divisible by <code>Z(x)</code>, giving a polynomial quotient <code>Q(x)</code>.
                            </li>
                            <li>
                                We verify at random LDE points (not trace points) where <code>Z(x) ≠ 0</code>.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
