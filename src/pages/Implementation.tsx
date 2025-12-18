import { Explainer } from '../components/Explainer';

export function ImplementationPage() {
    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Implementation Details</h1>
            <p>
                This page documents the design choices and simplifications made in this
                toy STARK implementation. Understanding these details helps bridge the gap
                between this educational tool and production STARK systems.
            </p>

            {/* STARK Lifecycle Overview */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h2>STARK Protocol Lifecycle</h2>
                <p className="muted">
                    In a real STARK system, different artifacts are created at different phases.
                    This toy implementation combines some steps for simplicity.
                </p>

                <div style={{ marginTop: '24px' }}>
                    <LifecyclePhase
                        phase="1. Setup (Program Compilation)"
                        who="Developer / Protocol Designer"
                        when="Once per program"
                        creates={[
                            { name: 'AIR Constraints', desc: 'Algebraic rules that valid executions must satisfy' },
                            { name: 'Constraint Degrees', desc: 'Maximum polynomial degrees for each constraint' },
                            { name: 'Public Parameters', desc: 'Field prime, trace width, blowup factor' },
                        ]}
                        notes="The AIR defines WHAT constitutes a valid computation. It's derived from the program logic and is public knowledge."
                    />

                    <LifecyclePhase
                        phase="2. Proving (Trace Generation)"
                        who="Prover (Alice)"
                        when="Each time someone runs a computation"
                        creates={[
                            { name: 'Execution Trace', desc: 'The actual values at each step (private witness)' },
                            { name: 'Trace Polynomials T(x)', desc: 'Interpolations of each trace column' },
                            { name: 'Constraint Polynomial H(x)', desc: 'Combined evaluation of all constraints' },
                            { name: 'Quotient Polynomial Q(x)', desc: 'H(x) divided by vanishing polynomial Z(x)' },
                        ]}
                        notes="The prover generates the trace by actually running the computation, then builds polynomials to prove it's valid."
                    />

                    <LifecyclePhase
                        phase="3. Commitment"
                        who="Prover (Alice)"
                        when="During proof generation"
                        creates={[
                            { name: 'Trace Commitment', desc: 'Merkle root of trace LDE evaluations' },
                            { name: 'Quotient Commitment', desc: 'Merkle root of quotient evaluations' },
                            { name: 'FRI Commitments', desc: 'Merkle roots for each FRI folding layer' },
                        ]}
                        notes="Commitments are created BEFORE seeing verifier challenges (Fiat-Shamir makes this non-interactive)."
                    />

                    <LifecyclePhase
                        phase="4. Verification"
                        who="Verifier (Bob)"
                        when="When checking a proof"
                        creates={[
                            { name: 'Random Challenges', desc: 'α (composition), β (FRI), query indices' },
                        ]}
                        notes="The verifier re-derives challenges from commitments and spot-checks the proof at random positions."
                    />
                </div>
            </div>

            {/* Polynomial Lifecycle */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h2>Polynomial Lifecycle</h2>
                <p className="muted">
                    Several polynomials are involved in a STARK proof. Here's when each is created and what it represents.
                </p>

                <div style={{ overflowX: 'auto', marginTop: '24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Polynomial</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Created By</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Degree</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Purpose</th>
                            </tr>
                        </thead>
                        <tbody>
                            <PolynomialRow
                                name="T_col(x)"
                                aka="Trace Polynomials"
                                createdBy="Prover"
                                degree="N - 1"
                                purpose="Encodes each column of the execution trace"
                            />
                            <PolynomialRow
                                name="C_i(x)"
                                aka="Constraint Polynomials"
                                createdBy="Setup"
                                degree="varies"
                                purpose="Evaluates to 0 on valid trace rows"
                            />
                            <PolynomialRow
                                name="Z(x)"
                                aka="Vanishing Polynomial"
                                createdBy="Public"
                                degree="N"
                                purpose="x^N - 1, zero on all N-th roots of unity"
                            />
                            <PolynomialRow
                                name="H(x)"
                                aka="Composition Polynomial"
                                createdBy="Prover"
                                degree="≤ N·d"
                                purpose="Random linear combination of all C_i(x)"
                            />
                            <PolynomialRow
                                name="Q(x)"
                                aka="Quotient Polynomial"
                                createdBy="Prover"
                                degree="≤ N·d - N"
                                purpose="H(x) / Z(x) — proves constraints vanish on trace"
                            />
                        </tbody>
                    </table>
                </div>

                <Explainer title="Why the Quotient Matters">
                    <p>
                        The key insight: if all constraints C_i(x) are zero on the trace domain
                        (the N-th roots of unity), then H(x) is also zero there.
                    </p>
                    <p style={{ marginTop: '12px' }}>
                        Since Z(x) = x^N - 1 is zero exactly on that domain, H(x) being zero there
                        means H(x) is divisible by Z(x). The quotient Q(x) = H(x) / Z(x) exists
                        and is a polynomial (not a rational function).
                    </p>
                    <p style={{ marginTop: '12px' }}>
                        The verifier checks this by verifying H(x) = Q(x) · Z(x) at random points
                        outside the trace domain.
                    </p>
                </Explainer>
            </div>

            {/* Field Choice */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h2>Field Selection</h2>
                <p className="muted">
                    STARKs require a finite field with roots of unity of the right order.
                </p>

                <div style={{ overflowX: 'auto', marginTop: '24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Prime p</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>p - 1</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Primitive Root</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Max Trace (blowup=4)</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Use Case</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>97</td>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>96 = 2⁵ × 3</td>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>5</td>
                                <td style={{ padding: '12px' }}>8 rows</td>
                                <td style={{ padding: '12px' }}>Tiny demos</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,255,100,0.05)' }}>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>257</td>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>256 = 2⁸</td>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>3</td>
                                <td style={{ padding: '12px' }}>64 rows</td>
                                <td style={{ padding: '12px', color: 'var(--accent-success)' }}>Recommended</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>769</td>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>768 = 2⁸ × 3</td>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>11</td>
                                <td style={{ padding: '12px' }}>64 rows</td>
                                <td style={{ padding: '12px' }}>Alternative</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <Explainer title="Why These Constraints?">
                    <p>
                        The LDE domain has size M = N × blowup. For roots of unity to exist,
                        M must divide p - 1.
                    </p>
                    <p style={{ marginTop: '12px' }}>
                        With p = 257 and blowup = 4, we need N × 4 to divide 256.
                        Valid N values (powers of 2): 1, 2, 4, 8, 16, 32, 64.
                    </p>
                    <p style={{ marginTop: '12px' }}>
                        Production STARKs use much larger primes (e.g., the Goldilocks prime
                        p = 2⁶⁴ - 2³² + 1) to support larger computations.
                    </p>
                </Explainer>
            </div>

            {/* Simplifications */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h2>Simplifications vs. Production STARKs</h2>
                <p className="muted">
                    This toy implementation omits several features for clarity.
                </p>

                <div style={{ marginTop: '24px' }}>
                    <SimplificationItem
                        feature="Cryptographic Hashing"
                        toy="Simple FNV-style hash"
                        production="SHA-256, Blake2, or Poseidon"
                        why="Real security requires collision-resistant hashes"
                    />
                    <SimplificationItem
                        feature="Zero-Knowledge"
                        toy="Not implemented"
                        production="Random blinding masks on polynomials"
                        why="Hides the actual trace values from the verifier"
                    />
                    <SimplificationItem
                        feature="DEEP Composition"
                        toy="Not implemented"
                        production="Out-of-domain sampling"
                        why="Improves soundness by sampling at random field elements"
                    />
                    <SimplificationItem
                        feature="Constraint Evaluation"
                        toy="Evaluated at base points only"
                        production="Full polynomial evaluation on LDE"
                        why="True low-degree testing requires evaluating everywhere"
                    />
                    <SimplificationItem
                        feature="FFT/NTT"
                        toy="Barycentric Lagrange O(n²)"
                        production="FFT-based O(n log n)"
                        why="Production systems need efficient polynomial operations"
                    />
                    <SimplificationItem
                        feature="Boundary Constraints"
                        toy="Checked at step 0"
                        production="Lagrange basis masking"
                        why="Proper handling of initial/final state constraints"
                    />
                </div>
            </div>

            {/* Parameters */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h2>Default Parameters</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginTop: '16px'
                }}>
                    <ParamCard name="Blowup Factor" value="4" desc="LDE expansion ratio" />
                    <ParamCard name="Query Count" value="4" desc="Random spot checks" />
                    <ParamCard name="FRI Folding" value="2" desc="Halving each round" />
                    <ParamCard name="Default Prime" value="257" desc="Supports up to 64 rows" />
                </div>
            </div>
        </div>
    );
}

// --- Sub-components ---

function LifecyclePhase({ phase, who, when, creates, notes }: {
    phase: string;
    who: string;
    when: string;
    creates: { name: string; desc: string }[];
    notes: string;
}) {
    return (
        <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            borderLeft: '4px solid var(--accent-primary)',
        }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-primary)' }}>{phase}</h4>
            <div style={{ fontSize: '0.9em', marginBottom: '12px' }}>
                <span className="muted">Who:</span> {who} &nbsp;|&nbsp;
                <span className="muted">When:</span> {when}
            </div>
            <div style={{ marginBottom: '12px' }}>
                <strong>Creates:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    {creates.map((item, i) => (
                        <li key={i}>
                            <code>{item.name}</code> — {item.desc}
                        </li>
                    ))}
                </ul>
            </div>
            <div style={{
                fontSize: '0.85em',
                fontStyle: 'italic',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '8px',
            }}>
                {notes}
            </div>
        </div>
    );
}

function PolynomialRow({ name, aka, createdBy, degree, purpose }: {
    name: string;
    aka: string;
    createdBy: string;
    degree: string;
    purpose: string;
}) {
    return (
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '12px' }}>
                <code style={{ color: 'var(--accent-secondary)' }}>{name}</code>
                <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{aka}</div>
            </td>
            <td style={{ padding: '12px' }}>{createdBy}</td>
            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{degree}</td>
            <td style={{ padding: '12px', fontSize: '0.9em' }}>{purpose}</td>
        </tr>
    );
}

function SimplificationItem({ feature, toy, production, why }: {
    feature: string;
    toy: string;
    production: string;
    why: string;
}) {
    return (
        <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{feature}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9em' }}>
                <div>
                    <span className="muted">This Implementation:</span>
                    <div>{toy}</div>
                </div>
                <div>
                    <span className="muted">Production:</span>
                    <div>{production}</div>
                </div>
            </div>
            <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '8px' }}>
                Why: {why}
            </div>
        </div>
    );
}

function ParamCard({ name, value, desc }: { name: string; value: string; desc: string }) {
    return (
        <div style={{
            padding: '16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            textAlign: 'center',
        }}>
            <div className="muted" style={{ fontSize: '0.85em' }}>{name}</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{value}</div>
            <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{desc}</div>
        </div>
    );
}
