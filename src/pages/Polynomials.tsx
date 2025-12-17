import { useStark } from '../contexts/StarkContext';
import { PolynomialGraph } from '../components/PolynomialGraph';
import { Link } from 'react-router-dom';

export function PolynomialsPage() {
    const { trace, regNames } = useStark();

    if (!trace || trace.length === 0) {
        return (
            <div className="container">
                <h1>1.5 Trace Polynomials</h1>
                <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                    <h3>No Trace Found</h3>
                    <p>Please generate a trace first.</p>
                    <Link to="/trace" className="button">Go to Step 1</Link>
                </div>
            </div>
        );
    }

    // Group values by register
    const regValues: Record<string, number[]> = {};
    regNames.forEach(reg => {
        regValues[reg] = trace.map(row => row.regs[reg]);
    });

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>1.5 Trace Polynomials</h1>
            <p>
                We have our execution trace. Now, we convert each column of the trace into a <strong>polynomial</strong>.
            </p>
            <p>
                For each register (column), we find a polynomial $P(x)$ such that $P(step) = value$.
            </p>

            <div style={{ margin: '24px 0', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)' }}>
                <strong>How is this created?</strong>
                <p style={{ marginTop: '8px', fontSize: '0.9em' }}>
                    Unlike the simple examples in the Basics section, this is your <strong>actual program trace</strong>.
                    <br />
                    In a full STARK, we would use <a href="https://en.wikipedia.org/wiki/Lagrange_polynomial" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Lagrange Interpolation</a> (or an FFT-based method) to define a unique finite-field polynomial that matches these values on the trace domain.
                    <br /><br />
                    This page visualizes the <em>evaluations</em> (samples) per step; it does not reconstruct or plot the finite-field polynomial coefficients.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px', alignItems: 'center' }}>
                {/* System Registers */}
                {['pc', 'halted'].map((reg) => (
                    <div key={reg} className="card" style={{ border: '1px dashed var(--text-muted)', width: '100%', maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3>Register {reg}</h3>
                            <span className="badge">Degree {trace.length - 1}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <PolynomialGraph
                                values={trace.map(r => r[reg as keyof typeof r] as number)}
                                width={600}
                                height={200}
                                color="var(--text-muted)"
                            />
                        </div>

                        <div style={{ marginTop: '16px', fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            <div>T_{reg}(0) = {trace[0][reg as keyof typeof trace[0]] as number}</div>
                            <div>T_{reg}(1) = {trace[1][reg as keyof typeof trace[0]] as number}</div>
                            <div>...</div>
                        </div>
                    </div>
                ))}

                {/* User Registers */}
                {regNames.map((reg, i) => (
                    <div key={reg} className="card" style={{ width: '100%', maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3>Register {reg}</h3>
                            <span className="badge">Degree {trace.length - 1}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <PolynomialGraph
                                values={regValues[reg]}
                                width={600}
                                height={200}
                                color={`hsl(${i * 60 + 200}, 70%, 60%)`}
                            />
                        </div>

                        <div style={{ marginTop: '16px', fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            <div>T_{reg}(0) = {regValues[reg][0]}</div>
                            <div>T_{reg}(1) = {regValues[reg][1]}</div>
                            <div>...</div>
                            <div>T_{reg}({trace.length - 1}) = {regValues[reg][trace.length - 1]}</div>
                        </div>
                    </div>
                ))}
            </div>



        </div>
    );
}
