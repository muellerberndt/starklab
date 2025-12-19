import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export function EncodingPage() {
    const [step, setStep] = useState(0);
    const [traceValues, setTraceValues] = useState([0, 2, 4, 6]);

    const handleTraceChange = (index: number, value: string) => {
        const newValues = [...traceValues];
        newValues[index] = parseInt(value) || 0;
        setTraceValues(newValues);
    };

    // Simple path generator for the graph
    const generatePath = () => {
        // Map trace values to coordinates
        // X range: 0-3 -> 20-280
        // Y range: min-max -> 180-20
        const min = Math.min(...traceValues, 0);
        const max = Math.max(...traceValues, 5);
        const range = max - min || 1;

        const points = traceValues.map((val, i) => {
            const x = 20 + (i / (traceValues.length - 1)) * 260;
            const y = 180 - ((val - min) / range) * 160;
            return { x, y };
        });

        // Generate SVG path (simple linear for now, or quadratic bezier)
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            // Simple curve smoothing
            const p0 = points[i - 1];
            const p1 = points[i];
            const midX = (p0.x + p1.x) / 2;
            d += ` Q ${midX} ${p0.y}, ${midX} ${p1.y} T ${p1.x} ${p1.y}`;
        }

        return { d, points };
    };

    const { d, points } = generatePath();

    const steps = [
        // ... (steps content remains mostly the same, but I'll keep the structure)
        {
            title: "1. The Example: Counter +2",
            desc: "Before we encode anything, let's define what we are encoding.",
            content: (
                <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                    <p style={{ fontSize: '1.1em', marginBottom: '24px' }}>
                        In this <strong>Basics</strong> section, we use a simple example:
                        <br />
                        A program that <strong>adds 2</strong> to a counter each step.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>Register r0</div>
                            <div style={{ fontSize: '1.5em', fontFamily: 'monospace', fontWeight: 'bold' }}>0, 2, 4, 6</div>
                        </div>
                    </div>
                    <div className="alert info">
                        <strong>Note:</strong> This is a fixed example for learning.
                        In the main protocol (Steps 1-6), we will work with your <strong>actual</strong> dynamic trace from the code editor!
                    </div>
                </div>
            )
        },
        {
            title: "2. Trace to Points",
            desc: "First, we treat the execution trace as a set of (x, y) coordinates.",
            content: (
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Execution Trace</h4>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace' }}>
                            {traceValues.map((val, i) => (
                                <div key={i}>Step {i}: {val}</div>
                            ))}
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '0.8em', color: 'var(--text-muted)', maxWidth: '200px' }}>
                            * These numbers represent the <strong>state</strong> of the program (e.g., variable values).
                        </div>
                    </div>
                    <ArrowRight size={24} color="var(--text-muted)" />
                    <div style={{ textAlign: 'center' }}>
                        <h4>Coordinates</h4>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace' }}>
                            {traceValues.map((val, i) => (
                                <div key={i}>({i}, {val})</div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "3. Interpolation",
            desc: "We find a polynomial T(x) that passes through ALL these points using Lagrange interpolation.",
            content: (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '1.2em', marginBottom: '16px', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        T(0)={traceValues[0]}, T(1)={traceValues[1]}, ...
                    </div>
                    <p>
                        <strong><a href="https://en.wikipedia.org/wiki/Lagrange_polynomial" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>Lagrange interpolation</a></strong> constructs this polynomial by summing weighted basis polynomials—each basis polynomial is 1 at one point and 0 at all others.
                    </p>
                    <p style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginTop: '16px' }}>
                        Production STARKs use FFT-based methods for efficiency, but the principle is the same.
                    </p>
                    <div style={{ height: '200px', borderBottom: '2px solid var(--border-color)', position: 'relative', marginTop: '32px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                            <path d={d} fill="none" stroke="var(--accent-primary)" strokeWidth="3" />
                            {points.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="6" fill="white" stroke="var(--accent-primary)" strokeWidth="2" />
                            ))}
                        </svg>
                    </div>
                    <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '16px', fontStyle: 'italic' }}>
                        Note: The curve is for visualization. Since we work in a finite field, the polynomial only has values at integer points (field elements), not "in between."
                    </p>
                </div>
            )
        },
        {
            title: "4. The Power of Polynomials",
            desc: "Why go through all this trouble? Because polynomials have a superpower.",
            content: (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                    <p style={{ fontSize: '1.2em', marginBottom: '32px' }}>
                        If two low-degree polynomials are the same at a few points, they are the same <strong>everywhere</strong>.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', textAlign: 'left' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '8px' }}>
                            <h4 style={{ color: 'var(--accent-primary)', marginTop: 0 }}>Compressed Logic</h4>
                            <p style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                Instead of checking billions of steps one by one, we can check a single polynomial equation.
                                <br /><br />
                                If the equation holds for the polynomial, it holds for the entire trace!
                            </p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '8px' }}>
                            <h4 style={{ color: 'var(--accent-secondary)', marginTop: 0 }}>Error Amplification</h4>
                            <p style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                If a prover tries to cheat in even one step, the resulting polynomial will be completely different almost everywhere.
                                <br /><br />
                                This makes it impossible to hide a single lie.
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        Next, in <strong>Basics III</strong>, we'll see exactly how we assume these rules using "Constraint Polynomials".
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Basics II: Encoding</h1>
            <p>
                How do we turn a list of numbers and some rules into a polynomial problem?
            </p>

            <div className="card" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setStep(i)}
                            style={{
                                padding: '12px 24px',
                                cursor: 'pointer',
                                borderBottom: step === i ? '2px solid var(--accent-primary)' : 'none',
                                color: step === i ? 'var(--accent-primary)' : 'var(--text-muted)',
                                fontWeight: step === i ? 'bold' : 'normal'
                            }}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>

                <h3>{steps[step].title}</h3>
                <p style={{ fontSize: '1.1em', marginBottom: '32px' }}>{steps[step].desc}</p>

                <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '32px' }}>
                    {steps[step].content}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                    >
                        Previous
                    </button>
                    <button
                        className="button"
                        onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                        disabled={step === steps.length - 1}
                    >
                        Next Step
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '32px', border: '1px solid var(--accent-secondary)' }}>
                <h3>Interactive Playground</h3>
                <p>Try changing the trace values to see how the points move.</p>

                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', justifyContent: 'center', marginTop: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {traceValues.map((val, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>Step {i}:</span>
                                <input
                                    type="number"
                                    value={val}
                                    onChange={(e) => handleTraceChange(i, e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid var(--border-color)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        width: '60px'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div style={{ width: '300px', height: '200px', border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative', background: 'rgba(0,0,0,0.2)' }}>
                        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                            {/* X-axis labels */}
                            {points.map((p, i) => (
                                <text
                                    key={`x-${i}`}
                                    x={p.x}
                                    y={215}
                                    fill="var(--text-muted)"
                                    fontSize="10"
                                    textAnchor="middle"
                                >
                                    {i}
                                </text>
                            ))}

                            <path d={d} fill="none" stroke="var(--accent-secondary)" strokeWidth="3" />
                            {points.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="var(--accent-secondary)" strokeWidth="2" />
                            ))}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
