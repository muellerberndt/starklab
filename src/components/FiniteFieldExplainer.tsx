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
            <div className="controls" style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                <label>
                    Prime (P):
                    <input
                        type="number"
                        value={prime}
                        onChange={(e) => setPrime(Math.max(2, parseInt(e.target.value) || 2))}
                        style={{ marginLeft: '8px', width: '60px', padding: '4px', background: 'rgba(255,255,255,0.15)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                    />
                </label>
                <label>
                    a:
                    <input
                        type="number"
                        value={a}
                        onChange={(e) => setA(parseInt(e.target.value) || 0)}
                        style={{ marginLeft: '8px', width: '60px', padding: '4px', background: 'rgba(255,255,255,0.15)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                    />
                </label>
                <label>
                    b:
                    <input
                        type="number"
                        value={b}
                        onChange={(e) => setB(parseInt(e.target.value) || 0)}
                        style={{ marginLeft: '8px', width: '60px', padding: '4px', background: 'rgba(255,255,255,0.15)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                    />
                </label>
            </div>

            <div className="visualizer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
                                    background: n === sum ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
                                    color: n === sum ? 'white' : 'var(--text-secondary)',
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
                                    background: n === prod ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.15)',
                                    color: n === prod ? 'black' : 'var(--text-secondary)',
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
