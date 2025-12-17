import { CodeEditor } from '../components/CodeEditor';
import { TraceTable } from '../components/TraceTable';
import { ConstraintViewer } from '../components/ConstraintViewer';
import { Explainer } from '../components/Explainer';
import { useStark } from '../contexts/StarkContext';

export function TracePage() {
    const { code, setCode, trace, regNames, air, failures, error, tamperTrace, resetTrace, resetCode } = useStark();

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>1. Trace & AIR</h1>
            <p>
                In this step, you act as <strong>Alice (The Prover)</strong>.
                <br />
                You write a program and run it. This does two things:
            </p>
            <ul style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
                <li><strong>Generates the Trace:</strong> The actual execution history (kept secret in a real zero-knowledge proof).</li>
                <li><strong>Defines the AIR:</strong> The algebraic constraints that describe <em>valid</em> execution (public knowledge).</li>
            </ul>

            <Explainer title="What is an Execution Trace?">
                <p>
                    A STARK proof starts with an <strong>Execution Trace</strong>. This is a table where:
                </p>
                <ul>
                    <li>Each <strong>column</strong> represents a register (like <code>r0</code>, <code>r1</code>).</li>
                    <li>Each <strong>row</strong> represents one step of the computation (one clock cycle).</li>
                </ul>
                <p>
                    The prover wants to prove they know a valid trace that satisfies the program's logic.
                </p>
            </Explainer>

            <div style={{ marginBottom: '32px' }}>
                <details style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    padding: '12px'
                }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📚 DSL Reference (Click to Expand)</summary>
                    <div style={{ marginTop: '16px', paddingLeft: '16px' }}>
                        <p><strong>Registers:</strong> <code>r0, r1, r2, ...</code> (up to r9)</p>
                        <p><strong>Commands:</strong></p>
                        <ul style={{ lineHeight: '1.6' }}>
                            <li><code>prime 97</code>: Set the field prime (must be first).</li>
                            <li><code>r0 = 1</code>: Initialize a register.</li>
                            <li><code>r0 = r1 + r2</code>: Addition.</li>
                            <li><code>r0 = r1 - r2</code>: Subtraction.</li>
                            <li><code>r0 = r1 * r2</code>: Multiplication.</li>
                            <li><code>repeat N: ...</code>: Repeat a block N times. Indent with 4 spaces.</li>
                        </ul>
                        <p><strong>Note:</strong> All math is modular (modulo the prime).</p>
                    </div>
                </details>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Program</h3>
                        <button
                            className="btn btn-ghost"
                            onClick={resetCode}
                            style={{ fontSize: '0.8em', padding: '6px 12px' }}
                        >
                            Reset Code
                        </button>
                    </div>
                    <CodeEditor
                        value={code}
                        onChange={setCode}
                        error={error}
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Execution Trace</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={resetTrace}
                                style={{ fontSize: '0.8em', padding: '6px 12px' }}
                            >
                                Repair Trace
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={tamperTrace}
                                style={{ fontSize: '0.8em', padding: '6px 12px', color: 'var(--accent-error)', borderColor: 'var(--accent-error)' }}
                            >
                                Corrupt Trace
                            </button>
                        </div>
                    </div>

                    {failures.length > 0 && (
                        <div className="alert error" style={{ marginBottom: '16px', padding: '12px' }}>
                            <strong>Warning:</strong> Trace is invalid! {failures.length} constraints violated.
                        </div>
                    )}

                    {trace.length > 0 ? (
                        <TraceTable trace={trace} regNames={regNames} />
                    ) : (
                        <div className="card muted">
                            No trace available. Fix errors to see execution.
                        </div>
                    )}
                </div>
            </div>

            {air && (
                <ConstraintViewer air={air} failures={failures} />
            )}
        </div>
    );
}
