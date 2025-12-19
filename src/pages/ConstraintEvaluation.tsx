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
    const trace = [
        { step: 0, r0: 0 },
        { step: 1, r0: 2 },
        { step: 2, r0: 4 },
        { step: 3, r0: 6 },
    ];

    // Polynomial values
    const r0Values = trace.map(t => t.r0);  // [0, 2, 4, 6]
    const r0Current = trace.slice(0, -1).map(t => t.r0);  // [0, 2, 4]
    const r0Next = trace.slice(1).map(t => t.r0);         // [2, 4, 6]
    const sum = r0Current.map(v => v + 2);                 // [2, 4, 6]
    const constraint = r0Next.map((next, i) => next - sum[i]); // [0, 0, 0]

    // Calculate shared Y range
    const allValues = [...r0Values, ...sum];
    const yMin = Math.min(...allValues) - 1;
    const yMax = Math.max(...allValues) + 1;

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Basics III: Applying Constraints to Polynomials</h1>
            <p>
                To check if a trace is valid, we substitute the trace polynomial into the constraint formula.
            </p>

            {/* Part 1: The Setup */}
            <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--accent-primary)' }}>
                <h3>The Two Ingredients</h3>
                <p>Both are public:</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--accent-secondary)' }}>1. The Constraint Formula</h4>
                        <p style={{ fontSize: '0.9em', marginBottom: '12px' }}>
                            A rule the program must follow, expressed as an equation:
                        </p>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '1.1em',
                            textAlign: 'center',
                            padding: '12px',
                            background: 'rgba(100, 200, 255, 0.1)',
                            borderRadius: '4px',
                            border: '1px solid var(--accent-secondary)'
                        }}>
                            r0<sub>next</sub> − (r0<sub>current</sub> + 2) = 0
                        </div>
                        <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0 }}>
                            "The next value of r0 must equal the current value plus 2"
                        </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--accent-primary)' }}>2. The Trace Polynomial P(x)</h4>
                        <p style={{ fontSize: '0.9em', marginBottom: '12px' }}>
                            The prover encodes their execution trace as a polynomial:
                        </p>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '0.95em',
                            padding: '12px',
                            background: 'rgba(100, 200, 255, 0.1)',
                            borderRadius: '4px',
                            border: '1px solid var(--accent-primary)'
                        }}>
                            P(0) = 0, P(1) = 2, P(2) = 4, P(3) = 6
                        </div>
                        <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0 }}>
                            A curve that passes through all the trace values
                        </p>
                    </div>
                </div>
            </div>

            {/* Part 2: The Key Step */}
            <div className="card" style={{ marginTop: '32px', border: '2px solid var(--accent-secondary)' }}>
                <h3 style={{ color: 'var(--accent-secondary)' }}>The Substitution</h3>

                <div style={{
                    margin: '16px 0',
                    padding: '20px',
                    background: 'rgba(100, 200, 255, 0.1)',
                    borderRadius: '8px',
                    border: '1px dashed var(--accent-secondary)'
                }}>
                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: '1.1em',
                        textAlign: 'center',
                        marginBottom: '16px'
                    }}>
                        r0<sub>next</sub> − (r0<sub>current</sub> + 2) = 0
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '1.2em', color: 'var(--text-muted)', margin: '8px 0' }}>↓ substitute P(x) for r0</div>

                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: '1.2em',
                        textAlign: 'center',
                        padding: '16px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        color: 'var(--accent-primary)'
                    }}>
                        C(x) = P(x+1) − (P(x) + 2)
                    </div>

                    <div style={{ marginTop: '16px', fontSize: '0.9em', color: 'var(--text-muted)', textAlign: 'center' }}>
                        C(x) is the <strong>constraint polynomial</strong>
                    </div>
                </div>
            </div>

            {/* Part 3: Visual Step-by-Step */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>Computing C(x) Step by Step</h3>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <SimpleGraph values={r0Values} color="var(--accent-primary)" label="P(x) — trace polynomial" yMin={yMin} yMax={yMax} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        maxWidth: '800px',
                        margin: '0 auto',
                        borderCollapse: 'collapse',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px', textAlign: 'center' }}>x</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--accent-primary)' }}>P(x)</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--accent-secondary)' }}>P(x+1)</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#bd93f9' }}>P(x) + 2</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>C(x) = P(x+1) − (P(x)+2)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {r0Current.map((current, i) => {
                                const next = r0Next[i];
                                const plusTwo = current + 2;
                                const result = next - plusTwo;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>{i}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{current}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{next}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', color: '#bd93f9', fontWeight: 'bold' }}>{plusTwo}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{next} − {plusTwo} = </span>
                                            <span style={{ color: 'var(--accent-success)', fontWeight: 'bold', fontSize: '1.1em' }}>
                                                {result}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                    <SimpleGraph values={constraint} color="var(--accent-success)" label="C(x) — constraint polynomial (all zeros!)" yMin={-2} yMax={2} />
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(0, 255, 100, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid var(--accent-success)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--accent-success)' }}>
                        C(x) = 0 at all points → trace is valid
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                        If the prover cheated (e.g., P(2) = 5), then C(1) ≠ 0.
                    </p>
                </div>
            </div>

        </div>
    );
}
