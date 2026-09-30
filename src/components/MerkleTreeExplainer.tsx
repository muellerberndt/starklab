import { useMemo, useState } from 'react';

import { demoHash, buildMerkleLevels } from '../core/merkle';

export function MerkleTreeExplainer() {
    const [messages, setMessages] = useState(['a', 'b', 'c', 'd']);
    const tree = useMemo(() => {
        const leaves = messages.map((m) => demoHash(m));
        const levels = buildMerkleLevels(leaves);
        return levels.reverse();
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

                <div tabIndex={0} role="region" aria-label="Merkle tree; scroll horizontally to inspect all nodes" style={{ overflowX: 'auto', marginTop: '32px' }}>
                    <div className="tree-viz" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: 'max-content', minWidth: '100%', paddingBottom: '12px' }}>
                        {tree.map((level, levelIndex) => (
                            <div key={levelIndex} style={{ display: 'flex', gap: '16px' }}>
                                {level.map((node, nodeIndex) => (
                                    <div
                                        key={`${levelIndex}-${nodeIndex}`}
                                        className="merkle-node"
                                        style={{
                                            padding: '8px 12px',
                                            background: levelIndex === 0 ? 'var(--lime)' : 'var(--bg-tertiary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            minWidth: '80px',
                                            textAlign: 'center',
                                            position: 'relative',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.8em', opacity: 0.7 }}>
                                            {levelIndex === 0 ? 'Root' : `Hash`}
                                        </div>
                                        <code style={{ background: 'transparent', color: 'inherit' }}>{node}</code>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="leaves-input" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <input
                                aria-label={`Leaf ${i} message`}
                                value={msg}
                                onChange={(e) => updateMessage(i, e.target.value)}
                                style={{
                                    width: '60px',
                                    minHeight: '44px',
                                    fontSize: '16px',
                                    padding: '8px',
                                    textAlign: 'center',
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
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
