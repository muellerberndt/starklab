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

    // All columns that will be committed
    const columns = ['pc', 'halted', ...regNames];

    // Extract values for each column
    const columnData: Record<string, number[]> = {};
    for (const col of columns) {
        columnData[col] = trace.map(row =>
            col === 'pc' ? row.pc :
            col === 'halted' ? row.halted :
            row.regs[col] ?? 0
        );
    }

    // In a real STARK, we'd compute LDE first, but for visualization we show the concept
    // Flatten all columns into one array (simulating what happens with LDE values)
    const allValues: number[] = [];
    for (const col of columns) {
        allValues.push(...columnData[col]);
    }

    // Compute hashes for each value
    const allLeaves = allValues.map(v => demoHash(String(v)));

    // Compute single combined root
    const combinedRoot = merkleRoot(allLeaves);

    // Also compute individual roots for comparison
    const individualRoots: Record<string, string> = {};
    for (const col of columns) {
        const leaves = columnData[col].map(v => demoHash(String(v)));
        individualRoots[col] = merkleRoot(leaves);
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>2. Commitments</h1>
            <p>
                The prover commits to the entire execution trace by sending a single Merkle root to the verifier.
            </p>

            <Explainer title="How It Works">
                <p>
                    All trace columns (pc, halted, and your registers) are combined into <strong>one Merkle tree</strong>.
                    The prover sends only the root - a single hash that represents the entire computation.
                </p>
                <p style={{ marginTop: '12px' }}>
                    <strong>Important:</strong> Before committing, the prover computes a <strong>Low-Degree Extension (LDE)</strong> of each column.
                    This means evaluating the trace polynomial on a <em>larger domain</em> (typically 4-16x bigger).
                </p>
                <p style={{ marginTop: '12px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    <strong>Why LDE?</strong> If we only committed to N trace points, a cheater could construct a polynomial
                    that passes through those points but is wrong elsewhere. By evaluating on M = 4N points, random spot-checks
                    are much more likely to catch cheating. This demo shows the concept with raw trace values for simplicity.
                </p>
            </Explainer>

            {/* Show the columns being combined */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3>All Trace Columns</h3>
                <p className="muted" style={{ marginBottom: '16px' }}>
                    {columns.length} columns × {trace.length} steps = {allValues.length} values total
                </p>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {columns.map((col, colIdx) => (
                        <div key={col} style={{
                            flex: '1 1 120px',
                            minWidth: '120px',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            borderTop: `3px solid hsl(${colIdx * 50 + 200}, 70%, 60%)`
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{col}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--text-muted)' }}>
                                {columnData[col].slice(0, 4).map((v, i) => (
                                    <div key={i}>[{i}]: {v}</div>
                                ))}
                                {columnData[col].length > 4 && <div>...</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Show the flattening */}
            <div className="card" style={{ marginTop: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5em', color: 'var(--text-muted)' }}>↓</div>
                <div style={{ fontWeight: 'bold', margin: '8px 0' }}>Flatten All Columns</div>
                <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    [{columns.map(c => `${c}[0..${trace.length - 1}]`).join(', ')}]
                </div>
            </div>

            {/* Show the combined commitment */}
            <div className="card" style={{ marginTop: '24px' }}>
                <h3>Single Combined Commitment</h3>
                <p className="muted" style={{ marginBottom: '16px' }}>
                    All {allValues.length} values → one Merkle root
                </p>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    flexWrap: 'wrap'
                }}>
                    {/* Flattened values preview */}
                    <div style={{
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.8em',
                        maxWidth: '300px'
                    }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Flattened values:</div>
                        [{allValues.slice(0, 8).join(', ')}{allValues.length > 8 ? ', ...' : ''}]
                    </div>

                    <div style={{ fontSize: '2em', color: 'var(--text-muted)' }}>→</div>

                    {/* Root */}
                    <div style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, var(--accent-primary), #9d4eff)',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.5em',
                        boxShadow: '0 8px 32px rgba(112, 0, 255, 0.3)'
                    }}>
                        {combinedRoot}
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    This single hash represents your entire execution trace!
                </p>
            </div>

            {/* Why not individual roots? */}
            <div className="card" style={{ marginTop: '32px', border: '1px solid var(--border-color)' }}>
                <h3>Why One Root Instead of Many?</h3>
                <p style={{ marginBottom: '16px' }}>
                    We could commit to each column separately, but combining them is more efficient:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>
                            Separate Roots (less efficient)
                        </div>
                        <div style={{ fontSize: '0.85em', fontFamily: 'monospace' }}>
                            {columns.slice(0, 3).map(col => (
                                <div key={col} style={{ marginBottom: '4px' }}>
                                    {col}: {individualRoots[col]}
                                </div>
                            ))}
                            {columns.length > 3 && <div>...</div>}
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.8em', color: 'var(--text-muted)' }}>
                            {columns.length} separate commitments
                        </div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(112, 0, 255, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                            Combined Root (preferred)
                        </div>
                        <div style={{ fontSize: '0.85em', fontFamily: 'monospace' }}>
                            all: {combinedRoot}
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.8em', color: 'var(--text-muted)' }}>
                            1 commitment for everything
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
