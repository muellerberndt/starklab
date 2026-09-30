import { useState } from 'react';

export function FiniteFieldExplainer() {
    const [prime, setPrime] = useState(7);
    const [a, setA] = useState(3);
    const [b, setB] = useState(5);

    const mod = (n: number, p: number) => ((n % p) + p) % p;

    const sum = mod(a + b, prime);
    const prod = mod(a * b, prime);

    // Generate the field elements
    const elements = Array.from({ length: prime }, (_, i) => i);

    return (
        <div className="finite-field-explainer">
            <div className="controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                <label>
                    Prime (P):
                    <select
                        value={prime}
                        onChange={(e) => setPrime(Number(e.target.value))}
                        style={{ marginLeft: '8px', minWidth: '76px', minHeight: '44px', padding: '8px', fontSize: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    >
                        {[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </label>
                <label>
                    a:
                    <input
                        type="number"
                        value={a}
                        onChange={(e) => setA(parseInt(e.target.value) || 0)}
                        style={{ marginLeft: '8px', width: '76px', minHeight: '44px', padding: '8px', fontSize: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                </label>
                <label>
                    b:
                    <input
                        type="number"
                        value={b}
                        onChange={(e) => setB(parseInt(e.target.value) || 0)}
                        style={{ marginLeft: '8px', width: '76px', minHeight: '44px', padding: '8px', fontSize: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                </label>
            </div>

            <div className="visualizer" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
                <div className="card">
                    <h4>Addition (mod {prime})</h4>
                    <div style={{ fontSize: '1.2em', margin: '16px 0' }}>
                        {a} + {b} = {a + b} ≡ <strong>{sum}</strong> (mod {prime})
                    </div>
                    <div className="number-line" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {elements.map(n => (
                            <div
                                key={n}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    background: n === sum ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    color: n === sum ? 'var(--bg-secondary)' : 'var(--text-secondary)',
                                    fontWeight: n === sum ? 'bold' : 'normal'
                                }}
                            >
                                {n}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h4>Multiplication (mod {prime})</h4>
                    <div style={{ fontSize: '1.2em', margin: '16px 0' }}>
                        {a} × {b} = {a * b} ≡ <strong>{prod}</strong> (mod {prime})
                    </div>
                    <div className="number-line" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {elements.map(n => (
                            <div
                                key={n}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    background: n === prod ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
                                    color: n === prod ? 'var(--bg-secondary)' : 'var(--text-secondary)',
                                    fontWeight: n === prod ? 'bold' : 'normal'
                                }}
                            >
                                {n}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
