import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';
import { demoHash, merkleRoot } from '../core/merkle';

export function CommitmentsPage() {
    const { trace, regNames } = useStark();

    if (trace.length === 0) {
        return (
            <div className="container">
                <h1>2. Commitments</h1>
                <div className="alert error">
                    No trace found! Please go back to the <strong>Trace</strong> page and generate a valid trace first.
                </div>
            </div>
        );
    }

    // For this tutorial, we'll simplify and just show one column being committed to.
    // In a real STARK, we commit to all columns (often combined).
    const selectedReg = regNames[0] || 'r0';
    const columnValues = trace.map(row => row.regs[selectedReg] ?? 0);
    const leaves = columnValues.map((v) => demoHash(String(v)));
    const root = merkleRoot(leaves);

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>2. Commitments</h1>
            <p>
                Now that we have an execution trace, the Prover needs to "commit" to it.
                This means sending a commitment (the <strong>Merkle Root</strong>) to the Verifier.
            </p>

            <Explainer title="Why Commit?">
                <p>
                    The trace might be huge (millions of steps). The Prover can't send the whole thing.
                    Instead, they put the trace into a Merkle Tree and send just the Root.
                </p>
                <p className="muted" style={{ fontSize: '0.9em' }}>
                    This demo uses a tiny, non-cryptographic hash so you can follow the structure. Real STARKs use standard cryptographic hashes.
                </p>
                <p>
                    Later, when the Verifier asks "What was the value at step 100?", the Prover can provide
                    that specific value along with a <strong>Merkle Path</strong> to prove it matches the Root.
                </p>
            </Explainer>

            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="card">
                    <h3>Trace Column: {selectedReg}</h3>
                    <p className="muted">Values from your execution trace</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        {columnValues.map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="muted" style={{ width: '60px' }}>Step {i}</span>
                                <div style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    minWidth: '60px',
                                    textAlign: 'center'
                                }}>
                                    {v}
                                </div>
                                <span className="muted">→</span>
                                <code style={{ color: 'var(--accent-secondary)' }}>{leaves[i]}</code>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3>Merkle Root</h3>
                    <p className="muted">The commitment to column {selectedReg}</p>

                    <div style={{
                        marginTop: '24px',
                        padding: '24px',
                        background: 'linear-gradient(135deg, var(--accent-primary), #9d4eff)',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.5em',
                        boxShadow: '0 8px 32px rgba(112, 0, 255, 0.3)'
                    }}>
                        {root}
                    </div>

                    <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9em' }}>
                        This single hex string represents the entire history of register <code>{selectedReg}</code>!
                    </p>
                </div>
            </div>
        </div>
    );
}
