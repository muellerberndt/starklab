import { ArrowDown, ArrowUp, Lock, ShieldCheck } from 'lucide-react';

export function ProtocolPage() {
    const steps = [
        {
            actor: 'Prover',
            action: 'Commit to Trace',
            desc: <span>I have run the program. Here is the <a href="https://en.wikipedia.org/wiki/Merkle_tree" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Merkle Root</a> of the execution trace (blinded).</span>,
            icon: Lock,
            data: 'Merkle Root (demo hash)'
        },
        {
            actor: 'Verifier',
            action: 'Send Challenges (Alphas)',
            desc: 'Prove it. Apply the constraints to your Trace Polynomials and combine them using these random numbers.',
            icon: ArrowDown,
            data: 'Random Coefficients (α₀, α₁, ...)'
        },
        {
            actor: 'Prover',
            action: 'Commit to Quotient',
            desc: 'I divided the combined constraints by the Vanishing Polynomial to get a Quotient $Q(x)$. Here is its Merkle Root.',
            icon: ArrowUp,
            data: 'Merkle Root of Quotient Poly'
        },
        {
            actor: 'Verifier',
            action: 'Send FRI Challenges',
            desc: 'Now prove that polynomial is low-degree. Fold it!',
            icon: ArrowDown,
            data: 'Folding Factor (β)'
        },
        {
            actor: 'Verifier',
            action: 'Query Phase',
            desc: 'Open the Merkle Trees at these random positions so I can check the constraints.',
            icon: ArrowDown,
            data: 'Random Indices (idx₁, idx₂, ...)'
        },
        {
            actor: 'Prover',
            action: 'Decommitment',
            desc: 'Here are the values and the Merkle Paths to prove they are authentic.',
            icon: ArrowUp,
            data: 'Trace Values + Merkle Paths'
        },
        {
            actor: 'Verifier',
            action: 'Final Check',
            desc: 'I verified the paths and the constraints hold. You are honest!',
            icon: ShieldCheck,
            data: 'ACCEPT / REJECT'
        }
    ];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>The STARK Protocol</h1>
            <p>
                Now let's see how STARKs specifically implement the prover/verifier model. STARKs are an <strong>Interactive Oracle Proof (IOP)</strong>
                with special properties: they're <strong>transparent</strong> (no trusted setup) and <strong>post-quantum secure</strong> (use hash functions, not elliptic curves).
            </p>
            <p style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginTop: '8px' }}>
                In practice, we use the Fiat-Shamir heuristic to make it non-interactive, but the logic below shows the underlying conversation.
            </p>

            <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                    <h3 style={{ borderBottom: '2px solid var(--accent-primary)', paddingBottom: '8px', marginBottom: '16px' }}>Phase 1: The Setup (Public)</h3>
                    <p style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Before any proving happens, everyone agrees on the <strong>Rules of the Game</strong> (the AIR).
                    </p>
                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4>The Rules (AIR)</h4>
                        <p style={{ fontSize: '0.9em' }}>
                            We define the <strong>Algebraic Intermediate Representation</strong>. This is "stored" as:
                        </p>
	                        <ul style={{ paddingLeft: '20px', margin: '8px 0', fontSize: '0.9em' }}>
	                            <li style={{ marginBottom: '8px' }}>
	                                <strong>Constraint Equations:</strong> The mathematical formulas (e.g., $A(x) + B(x) = C(x)$).
	                            </li>
	                            <li>
	                                <strong>Constraint Activation:</strong> In production systems this is typically done with selector columns/polynomials; in this toy VM we generate a small set of per-step transition constraints directly.
	                            </li>
	                        </ul>
                        <p style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>
                            * Unlike the Trace, these are <strong>Public</strong> and fixed for the program.
                        </p>
                    </div>
                </div>

                <div>
                    <h3 style={{ borderBottom: '2px solid var(--accent-secondary)', paddingBottom: '8px', marginBottom: '16px' }}>Phase 2: Execution (Private)</h3>
                    <p style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Alice (the Prover) runs the program with her secret inputs.
                    </p>
                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4>The Execution Trace</h4>
                        <p style={{ fontSize: '0.9em' }}>
                            Running the code generates a concrete list of numbers (the Trace).
                        </p>
                        <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', margin: '8px 0', fontSize: '0.9em' }}>
                            Step 0: 1, 1<br />
                            Step 1: 1, 2<br />
                            Step 2: 2, 3...
                        </div>
                        <p style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>
                            * Only Alice knows this initially! She wants to prove she has it.
                        </p>
                    </div>
                </div>
            </div>


            <h3 style={{ marginTop: '48px', marginBottom: '24px' }}>The Interaction</h3>

            <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)', transform: 'translateX(-50%)' }}></div>

                {steps.map((step, i) => {
                    const isProver = step.actor === 'Prover';
                    return (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: isProver ? 'flex-start' : 'flex-end',
                            marginBottom: '32px',
                            position: 'relative'
                        }}>
                            {/* Dot on line */}
                            <div style={{
                                position: 'absolute',
                                left: '50%',
                                top: '24px',
                                width: '12px',
                                height: '12px',
                                background: isProver ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 2,
                                border: '2px solid var(--bg-primary)'
                            }}></div>

                            <div style={{
                                width: '45%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '16px',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <step.icon size={18} color={isProver ? 'var(--accent-secondary)' : 'var(--accent-primary)'} />
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: isProver ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                                        textTransform: 'uppercase',
                                        fontSize: '0.8em'
                                    }}>
                                        {step.actor}: {step.action}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9em', marginBottom: '12px' }}>{step.desc}</p>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    fontSize: '0.8em',
                                    fontFamily: 'var(--font-mono)',
                                    borderLeft: `2px solid ${isProver ? 'var(--accent-secondary)' : 'var(--accent-primary)'}`
                                }}>
                                    DATA: {step.data}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* STARK-Specific Components */}
            <div className="card" style={{ marginTop: '48px', background: 'rgba(100, 200, 255, 0.05)', border: '1px solid rgba(100, 200, 255, 0.2)' }}>
                <h3 style={{ marginTop: 0 }}>What Makes STARKs Special</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-primary)' }}>Merkle Commitments</div>
                        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted)' }}>
                            The prover commits to polynomial evaluations using Merkle trees. This allows selective opening without revealing everything.
                        </p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-secondary)' }}>FRI Protocol</div>
                        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted)' }}>
                            Fast Reed-Solomon IOP of Proximity — proves that committed values come from a low-degree polynomial, using only hashes.
                        </p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-success)' }}>Quotient Polynomial</div>
                        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted)' }}>
                            Dividing by the vanishing polynomial converts "constraints hold at all trace points" into "this is a valid polynomial."
                        </p>
                    </div>
                </div>
                <p style={{ marginTop: '16px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                    The pages that follow (1-6) explain each of these components in detail.
                </p>
            </div>

            <div className="card" style={{ marginTop: '32px', border: '1px solid var(--accent-primary)' }}>
                <h3 style={{ color: 'var(--accent-primary)', marginTop: 0 }}>Math Deep Dive: "Applying" Constraints</h3>
                <p>
                    How do we mathematically check the trace? We use <strong>Polynomial Substitution</strong>.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--text-primary)' }}>1. The Ingredients</h4>
                        <ul style={{ paddingLeft: '20px', fontSize: '0.9em', lineHeight: '1.6' }}>
                            <li>
                                <strong>Trace Polynomial $T(x)$</strong>: A curve that passes through all your trace values.
                                <br /><span style={{ color: 'var(--text-muted)' }}>$T(0)=1, T(1)=1, T(2)=2...$</span>
                            </li>
                            <li>
                                <strong>Constraint</strong>: A rule that must hold for any valid step.
                                <br /><span style={{ color: 'var(--text-muted)' }}>$Next - (Curr + Curr) = 0$</span>
                            </li>
                        </ul>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--text-primary)' }}>2. The Check (Division)</h4>
                        <p style={{ fontSize: '0.9em', lineHeight: '1.6' }}>
                            We don't just check if $P(x) = 0$. We check if $P(x)$ is <strong>divisible</strong> by a target polynomial $Z(x)$ that is zero on all steps.
                        </p>
                        <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', margin: '8px 0' }}>
                            $Q(x) = P(x) / Z(x)$
                        </div>
                        <p style={{ fontSize: '0.9em', margin: 0 }}>
                            If the Prover is honest, $Q(x)$ is a clean polynomial. <br />
                            If they lie, the division fails and $Q(x)$ becomes a mess (high degree).
                        </p>
                    </div>
                </div>
            </div>


        </div>
    );
}
