import { useState, useEffect } from 'react';

// Simple hash function for demo (not secure)
const hash = (s: string) => {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    }
    return ((h ^ h >>> 16) >>> 0).toString(16).substring(0, 6);
};

export function MerkleTreeExplainer() {
    const [messages, setMessages] = useState(['a', 'b', 'c', 'd']);
    const [tree, setTree] = useState<string[][]>([]);

    useEffect(() => {
        // Build tree
        const leaves = messages.map(m => hash(m));
        const levels = [leaves];

        let current = leaves;
        while (current.length > 1) {
            const next = [];
            for (let i = 0; i < current.length; i += 2) {
                const left = current[i];
                const right = i + 1 < current.length ? current[i + 1] : '';
                next.push(hash(left + right));
            }
            levels.push(next);
            current = next;
        }
        setTree(levels.reverse());
    }, [messages]);

    const updateMessage = (index: number, val: string) => {
        const newMessages = [...messages];
        newMessages[index] = val;
        setMessages(newMessages);
    };

    return (
        <div className="merkle-explainer">
            <div className="card">
                <h4>Merkle Tree Builder</h4>
                <p className="muted">
                    Edit the messages at the bottom. Watch how the hash changes propagate up to the root.
                </p>

                <div className="tree-viz" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', marginTop: '32px' }}>
                    {tree.map((level, levelIndex) => (
                        <div key={levelIndex} style={{ display: 'flex', gap: '16px' }}>
                            {level.map((node, nodeIndex) => (
                                <div
                                    key={`${levelIndex}-${nodeIndex}`}
                                    className="merkle-node"
                                    style={{
                                        padding: '8px 12px',
                                        background: levelIndex === 0 ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        minWidth: '80px',
                                        textAlign: 'center',
                                        position: 'relative',
                                        color: levelIndex === 0 ? 'white' : 'var(--text-primary)'
                                    }}
                                >
                                    <div style={{ fontSize: '0.8em', opacity: 0.7 }}>
                                        {levelIndex === 0 ? 'Root' : `Hash`}
                                    </div>
                                    <code>{node}</code>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="leaves-input" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <input
                                value={msg}
                                onChange={(e) => updateMessage(i, e.target.value)}
                                style={{
                                    width: '60px',
                                    padding: '8px',
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    borderRadius: '4px'
                                }}
                            />
                            <span className="muted" style={{ fontSize: '0.8em' }}>Leaf {i}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
