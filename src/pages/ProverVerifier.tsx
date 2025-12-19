// Simple graph component for polynomial visualization
function SimpleGraph({
    values,
    color,
    label,
    yMin,
    yMax,
}: {
    values: number[];
    color: string;
    label: string;
    yMin: number;
    yMax: number;
}) {
    const width = 240;
    const height = 120;
    const padding = { top: 20, right: 20, bottom: 25, left: 35 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const range = yMax - yMin || 1;

    const points = values.map((val, i) => ({
        x: padding.left + (i / (values.length - 1 || 1)) * graphWidth,
        y: padding.top + graphHeight - ((val - yMin) / range) * graphHeight,
        val
    }));

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    const zeroY = padding.top + graphHeight - ((0 - yMin) / range) * graphHeight;

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ color, fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85em' }}>{label}</div>
            <svg width={width} height={height} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="var(--border-color)" />
                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="var(--border-color)" />

                {yMin <= 0 && yMax >= 0 && (
                    <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="var(--text-muted)" strokeDasharray="4" strokeOpacity={0.5} />
                )}

                <text x={padding.left - 5} y={padding.top + 5} fill="var(--text-muted)" fontSize="9" textAnchor="end">{yMax}</text>
                <text x={padding.left - 5} y={height - padding.bottom} fill="var(--text-muted)" fontSize="9" textAnchor="end">{yMin}</text>

                {points.map((p, i) => (
                    <text key={i} x={p.x} y={height - 8} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{i}</text>
                ))}

                <path d={pathD} fill="none" stroke={color} strokeWidth="2" />

                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
                        <text x={p.x} y={p.y - 8} fill={color} fontSize="10" textAnchor="middle" fontWeight="bold">{p.val}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

export function ProverVerifierPage() {
    // Same simple example: r0 increments by 2 each step
    const trace = [
        { step: 0, r0: 0 },
        { step: 1, r0: 2 },
        { step: 2, r0: 4 },
        { step: 3, r0: 6 },
    ];

    const r0Current = trace.slice(0, -1).map(t => t.r0);  // [0, 2, 4]
    const r0Next = trace.slice(1).map(t => t.r0);         // [2, 4, 6]
    const sum = r0Current.map(v => v + 2);                 // [2, 4, 6]
    const constraint = r0Next.map((next, i) => next - sum[i]); // [0, 0, 0]

    const allValues = [...r0Current, ...r0Next, ...sum];
    const yMin = Math.min(...allValues) - 1;
    const yMax = Math.max(...allValues) + 1;

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Basics IV: Prover & Verifier</h1>
            <p>
                Now that we understand constraints, let's see how the prover and verifier work together.
                This page covers the <strong>general idea</strong> — the next section dives into the specific STARK protocol.
            </p>

            {/* The Setup */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-primary)' }}>
                <h3>The Setup: What's Agreed Upon</h3>
                <p>
                    Before any proving happens, both parties agree on:
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    marginTop: '16px'
                }}>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>📜</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>The Program</div>
                        <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>What computation to prove</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>📐</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Constraint Formulas</div>
                        <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Rules the trace must satisfy</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>🔢</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Field & Parameters</div>
                        <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Prime, trace length, etc.</div>
                    </div>
                </div>
                <p style={{ marginTop: '16px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    The constraint formulas are <strong>public</strong> — they define "what it means to run the program correctly."
                </p>
            </div>

            {/* Prover's Job */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{ color: 'var(--accent-primary)' }}>The Prover's Job</h3>
                <p>
                    The prover wants to convince the verifier that they executed the program correctly,
                    without revealing the entire execution trace.
                </p>

                <div style={{ marginTop: '24px' }}>
                    {/* Step 1 */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>1</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Execute & Generate Trace</div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Run the program and record the state at each step.
                            </div>
                            <div style={{
                                marginTop: '12px',
                                padding: '12px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '0.85em'
                            }}>
                                Trace: r0 = [0, 2, 4, 6]
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>2</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Encode as Polynomial</div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Use Lagrange interpolation to create a polynomial that passes through all trace points.
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                                <SimpleGraph values={r0Current} color="var(--accent-primary)" label="P_r0(x) — Trace Polynomial" yMin={yMin} yMax={yMax} />
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>3</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Apply Constraint Formula</div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Compute the constraint polynomial C(x) using the public formula.
                            </div>
                            <div style={{
                                marginTop: '12px',
                                padding: '8px 12px',
                                background: 'rgba(100, 200, 255, 0.1)',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                                textAlign: 'center'
                            }}>
                                C(x) = P_r0(x+1) − (P_r0(x) + 2)
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                                <SimpleGraph values={constraint} color="var(--accent-success)" label="C(x) = 0 everywhere" yMin={-2} yMax={2} />
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>4</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Commit & Prove</div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Commit to the polynomials (using Merkle trees) and prove that C(x) = 0 at all trace points
                                using the FRI protocol.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verifier's Job */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{ color: 'var(--accent-secondary)' }}>The Verifier's Job</h3>
                <p>
                    The verifier checks the prover's claim <strong>without</strong> seeing the full trace.
                </p>

                <div style={{ marginTop: '24px' }}>
                    {/* Step 1 */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-secondary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>1</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Receive Commitments</div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Get Merkle roots that commit the prover to specific polynomial values.
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-secondary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>2</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Generate Random Challenges</div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Pick random points to query (using Fiat-Shamir for non-interactivity).
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-secondary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>3</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Spot-Check Constraints</div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Using the <strong>same public constraint formula</strong>, verify that the prover's
                                polynomial values satisfy the constraints at the queried points.
                            </div>
                            <div style={{
                                marginTop: '12px',
                                padding: '12px',
                                background: 'rgba(0, 255, 100, 0.1)',
                                borderRadius: '8px',
                                fontSize: '0.9em'
                            }}>
                                If all checks pass → Accept the proof<br />
                                If any check fails → Reject (prover cheated)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why This Works */}
            <div className="card" style={{ marginTop: '32px', background: 'rgba(100, 200, 255, 0.05)' }}>
                <h3>Why This Works</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-success)' }}>Honest Prover</div>
                        <p style={{ margin: 0, fontSize: '0.9em' }}>
                            If the trace is valid, C(x) = 0 everywhere, so all spot-checks pass.
                        </p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-error)' }}>Cheating Prover</div>
                        <p style={{ margin: 0, fontSize: '0.9em' }}>
                            If even one constraint fails, C(x) ≠ 0 almost everywhere.
                            Random queries will catch this with high probability.
                        </p>
                    </div>
                </div>
            </div>

            {/* Advanced: Different Instructions */}
            <div className="card" style={{ marginTop: '32px', opacity: 0.85 }}>
                <h3 style={{ fontSize: '1em', color: 'var(--text-muted)' }}>Advanced: Handling Different Instructions</h3>
                <p style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    Real programs have different operations (ADD, MUL, etc.). STARKs use <strong>selector columns</strong> —
                    extra trace columns that are 1 when an instruction is active and 0 otherwise.
                    This lets us combine all instruction constraints into one formula:
                </p>
                <div style={{
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '12px',
                    borderRadius: '4px',
                    margin: '12px 0',
                    fontSize: '0.85em'
                }}>
                    C(x) = sel_add(x) · (r2 − r0 − r1) + sel_mul(x) · (r2 − r0 · r1) + ...
                </div>
                <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted)' }}>
                    When sel_add=1 and sel_mul=0, only the ADD constraint is active. This way, a fixed set of
                    constraints can verify any program!
                </p>
            </div>
        </div>
    );
}
