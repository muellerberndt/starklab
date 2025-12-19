// Simple graph component that uses a shared Y scale for comparison
function SimpleGraph({
    values,
    color,
    label,
    yMin,
    yMax,
    showPoints = true
}: {
    values: number[];
    color: string;
    label: string;
    yMin: number;
    yMax: number;
    showPoints?: boolean;
}) {
    const width = 280;
    const height = 140;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const range = yMax - yMin || 1;

    const points = values.map((val, i) => ({
        x: padding.left + (i / (values.length - 1 || 1)) * graphWidth,
        y: padding.top + graphHeight - ((val - yMin) / range) * graphHeight,
        val
    }));

    // Create smooth curve path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    // Y-axis zero line position
    const zeroY = padding.top + graphHeight - ((0 - yMin) / range) * graphHeight;

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ color, fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9em' }}>{label}</div>
            <svg width={width} height={height} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                {/* Grid */}
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="var(--border-color)" />
                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="var(--border-color)" />

                {/* Zero line if in range */}
                {yMin <= 0 && yMax >= 0 && (
                    <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="var(--text-muted)" strokeDasharray="4" strokeOpacity={0.5} />
                )}

                {/* Y axis labels */}
                <text x={padding.left - 5} y={padding.top + 5} fill="var(--text-muted)" fontSize="10" textAnchor="end">{yMax}</text>
                <text x={padding.left - 5} y={height - padding.bottom} fill="var(--text-muted)" fontSize="10" textAnchor="end">{yMin}</text>

                {/* X axis labels */}
                {points.map((p, i) => (
                    <text key={i} x={p.x} y={height - 10} fill="var(--text-muted)" fontSize="10" textAnchor="middle">{i}</text>
                ))}

                {/* Line */}
                <path d={pathD} fill="none" stroke={color} strokeWidth="2" />

                {/* Points with values */}
                {showPoints && points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2" />
                        <text x={p.x} y={p.y - 10} fill={color} fontSize="11" textAnchor="middle" fontWeight="bold">{p.val}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

export function ConstraintEvaluationPage() {
    // Simple 4-step counter example: r0 increments by 2 each step
    // r0: 0, 2, 4, 6
    // Constraint: r0_next = r0_current + 2
    const trace = [
        { step: 0, r0: 0 },
        { step: 1, r0: 2 },
        { step: 2, r0: 4 },
        { step: 3, r0: 6 },
    ];

    // For polynomial visualization, we need:
    // P_r0(x) values at x=0,1,2: [0, 2, 4] (we check transitions 0→1, 1→2, 2→3)
    // P_r0(x+1) values: [2, 4, 6] (the "next" values)
    // Constant 2: [2, 2, 2]
    // Sum P_r0(x) + 2: [2, 4, 6]
    // Constraint C(x) = P_r0(x+1) - (P_r0(x) + 2): [0, 0, 0]

    const r0Current = trace.slice(0, -1).map(t => t.r0);  // [0, 2, 4]
    const r0Next = trace.slice(1).map(t => t.r0);         // [2, 4, 6]
    const constant2 = r0Current.map(() => 2);              // [2, 2, 2]
    const sum = r0Current.map((v, i) => v + constant2[i]); // [2, 4, 6]
    const constraint = r0Next.map((next, i) => next - sum[i]); // [0, 0, 0]

    // Calculate shared Y range for all polynomials (except constraint which has its own)
    const allValues = [...r0Current, ...r0Next, ...constant2, ...sum];
    const yMin = Math.min(...allValues) - 1;
    const yMax = Math.max(...allValues) + 1;

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Basics III: Constraints</h1>
            <p>
                How do we express "the program ran correctly" as a mathematical equation?
            </p>

            {/* What is a constraint */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-primary)' }}>
                <h3>What is a Constraint?</h3>
                <p>
                    A <strong>constraint</strong> is a rule that must be satisfied at each step of the computation.
                    We express constraints as equations that equal <strong>zero</strong> when the rule is followed.
                </p>
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>Example:</strong> A program that adds 2 to a counter each step:
                    </p>
                    <div style={{ fontFamily: 'monospace', margin: '12px 0', fontSize: '1.1em', textAlign: 'center' }}>
                        r0<sub>next</sub> − (r0<sub>current</sub> + 2) = 0
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>
                        If this equals 0, the rule was followed. Non-zero means the rule was violated.
                    </p>
                </div>
            </div>

            {/* The trace table */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Our Example Trace</h3>
                <p>
                    Here's a simple 4-step trace where r0 starts at 0 and increases by 2 each step:
                </p>
                <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                    <table style={{
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                        borderCollapse: 'collapse',
                        fontFamily: 'monospace',
                        fontSize: '0.95em'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Step (x)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent-primary)' }}>r0</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>r0 + 2</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>r0<sub>next</sub></th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Constraint</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trace.slice(0, -1).map((row, i) => {
                                const nextR0 = trace[i + 1].r0;
                                const expected = row.r0 + 2;
                                const diff = nextR0 - expected;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.step}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{row.r0}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{expected}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{nextR0}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>
                                                {nextR0} − {expected} = {diff} ✓
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p style={{ marginTop: '16px', textAlign: 'center', color: 'var(--accent-success)', fontWeight: 'bold' }}>
                    All constraints evaluate to 0!
                </p>
            </div>

            {/* Polynomial visualization */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-secondary)' }}>
                <h3>Visualizing as Polynomials</h3>
                <p>
                    In STARKs, we encode each column as a polynomial using{' '}
                    <a href="https://en.wikipedia.org/wiki/Lagrange_polynomial" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
                        Lagrange interpolation
                    </a>. Let's see how the constraint looks as polynomial arithmetic:
                </p>

                {/* Row 1: P_r0(x) and constant 2 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    marginTop: '24px',
                    flexWrap: 'wrap'
                }}>
                    <SimpleGraph values={r0Current} color="var(--accent-primary)" label="P_r0(x)" yMin={yMin} yMax={yMax} />
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>+</div>
                    <SimpleGraph values={constant2} color="var(--accent-tertiary)" label="2 (constant)" yMin={yMin} yMax={yMax} />
                </div>

                {/* Equals */}
                <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '1.5em', fontWeight: 'bold' }}>=</div>

                {/* Row 2: Sum */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <SimpleGraph values={sum} color="#bd93f9" label="P_r0(x) + 2" yMin={yMin} yMax={yMax} />
                </div>

                {/* This should equal... */}
                <div style={{
                    textAlign: 'center',
                    margin: '24px 0',
                    padding: '12px',
                    background: 'rgba(0,255,100,0.1)',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '1em', marginBottom: '8px' }}>This should equal...</div>
                </div>

                {/* Row 3: P_r0(x+1) */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <SimpleGraph values={r0Next} color="var(--accent-secondary)" label="P_r0(x+1) — the 'next' values" yMin={yMin} yMax={yMax} />
                </div>

                {/* Comparison note */}
                <div style={{
                    textAlign: 'center',
                    margin: '16px 0',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px'
                }}>
                    <p style={{ margin: 0, fontSize: '0.95em' }}>
                        Notice: <span style={{ color: '#bd93f9', fontWeight: 'bold' }}>P_r0(x) + 2</span> = [2, 4, 6]
                        matches exactly with <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>P_r0(x+1)</span> = [2, 4, 6]
                    </p>
                </div>

                {/* Constraint polynomial */}
                <div style={{
                    textAlign: 'center',
                    margin: '24px 0 16px',
                    fontSize: '1em'
                }}>
                    <strong>Constraint polynomial:</strong> C(x) = P_r0(x+1) − (P_r0(x) + 2)
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <SimpleGraph values={constraint} color="var(--accent-success)" label="C(x) = 0 everywhere!" yMin={-2} yMax={2} />
                </div>

                <p style={{ marginTop: '16px', textAlign: 'center', color: 'var(--accent-success)', fontWeight: 'bold' }}>
                    The constraint polynomial is zero at all points — the trace is valid!
                </p>
            </div>

            {/* Key insight */}
            <div className="card" style={{ marginTop: '32px', background: 'rgba(100, 200, 255, 0.05)' }}>
                <h3>The Key Insight</h3>
                <p>
                    By expressing constraints as polynomials:
                </p>
                <ul style={{ marginTop: '8px', lineHeight: '1.8' }}>
                    <li><strong>Compression:</strong> Instead of checking N separate equations, we check one polynomial identity</li>
                    <li><strong>Error amplification:</strong> If even one constraint fails, C(x) will be non-zero <em>almost everywhere</em></li>
                    <li><strong>Efficient verification:</strong> The verifier only needs to check C(x) at a few random points</li>
                </ul>
            </div>

            {/* Advanced note about selectors */}
            <div className="card" style={{ marginTop: '32px', opacity: 0.8 }}>
                <h3 style={{ fontSize: '1em', color: 'var(--text-muted)' }}>Advanced: Handling Different Instructions</h3>
                <p style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    Real programs have different operations (ADD, MUL, etc.). STARKs use <strong>selector columns</strong> —
                    extra columns that "turn on" the right constraint for each instruction type. This way, a fixed set of
                    constraints can verify any program.
                </p>
            </div>
        </div>
    );
}
