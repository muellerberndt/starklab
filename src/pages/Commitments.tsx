import { useStark } from '../contexts/StarkContext';
import { Explainer } from '../components/Explainer';

// Simple hash function for demo (same as in MerkleTreeExplainer)
const hash = (s: string) => {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    }
    return ((h ^ h >>> 16) >>> 0).toString(16).substring(0, 6);
};

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
    const leaves = columnValues.map(v => hash(String(v)));

    // Calculate root (simplified single column tree)
    let current = leaves;
    while (current.length > 1) {
        const next = [];
        for (let i = 0; i < current.length; i += 2) {
            const left = current[i];
            const right = i + 1 < current.length ? current[i + 1] : '';
            next.push(hash(left + right));
        }
        current = next;
    }
    const root = current[0];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>2. Commitments</h1>
            <p>
                Now that we have an execution trace, the Prover needs to "commit" to it.
                This means sending a cryptographic fingerprint (the <strong>Merkle Root</strong>) to the Verifier.
            </p>

            <Explainer title="Why Commit?">
                <p>
                    The trace might be huge (millions of steps). The Prover can't send the whole thing.
                    Instead, they put the trace into a Merkle Tree and send just the Root.
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
