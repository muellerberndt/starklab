import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare } from 'lucide-react';

export function FAQPage() {
    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Frequently Asked Questions</h1>
            <p className="intro">
                Deep dives into common questions about STARK security and mechanics.
            </p>

            <div className="card" style={{ marginTop: '32px', border: '1px solid var(--accent-error)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <ShieldCheck size={24} color="var(--accent-error)" />
                    <h3 style={{ margin: 0 }}>Can't the Prover just commit to ANY zero polynomial?</h3>
                </div>

                <p>
                    You might be thinking: <em style={{ color: 'var(--text-muted)' }}>"Why doesn't the Prover just commit to $H(x) = 0$ everywhere? That would satisfy the check!"</em>
                </p>

                <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--accent-primary)', marginTop: 0 }}>The Defense: The Quotient Check</h4>
                    <p style={{ fontSize: '0.9em' }}>
                        The Prover doesn't just commit to "Zero". They must commit to the <strong>Quotient Polynomial</strong> $Q(x) = H(x) / Z(x)$.
                        <br /><br />
                        The Verifier checks this specific equation at a random point $z$:
                    </p>
                    <div style={{ textAlign: 'center', fontFamily: 'monospace', margin: '16px 0', fontSize: '1.2em' }}>
                        H(z) == Q(z) * Z(z)
                    </div>
                    <p style={{ fontSize: '0.9em' }}>
                        Here is the trap:
                        <ul style={{ lineHeight: '1.6', marginTop: '8px' }}>
                            <li>$H(z)$ is computed from the <strong>Trace Polynomials</strong> (which the Prover committed to in Step 1).</li>
                            <li>$Z(z)$ is publicly known (it's zero on the trace domain).</li>
                        </ul>
                        If the Prover tries to fake $H(x)$ by setting it to 0, then $Q(x)$ must be 0.
                        But since $H(z)$ is securely tied to the existing Trace commitment, unless the Trace <em>actually</em> satisfies the constraints, the equation will fail!
                    </p>
                </div>
            </div>

            <div className="card" style={{ marginTop: '32px', border: '1px solid var(--accent-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <MessageSquare size={24} color="var(--accent-secondary)" />
                    <h3 style={{ margin: 0 }}>Aren't STARKs non-interactive?</h3>
                </div>

                <p>
                    In our <strong>Protocol Overview</strong>, we showed a conversation between Prover and Verifier.
                    But isn't the whole point of a ZK-Proof that you can just send it in a single email (or blockchain transaction)?
                </p>

                <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--accent-secondary)', marginTop: 0 }}>The <a href="https://en.wikipedia.org/wiki/Fiat%E2%80%93Shamir_heuristic" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Fiat-Shamir Transform</a></h4>
                    <p style={{ fontSize: '0.9em' }}>
                        We use a cryptographic trick to turn the interactive conversation into a monologue.
                    </p>
                    <div style={{ margin: '16px 0', borderLeft: '4px solid var(--accent-secondary)', paddingLeft: '16px' }}>
                        Instead of waiting for the Verifier to send a random number (Challenge), the Prover <strong>hashes their own previous work</strong> to generate the random number themselves!
                    </div>
                    <p style={{ fontSize: '0.9em' }}>
                        Example:
                        <br />
                        <em>Interactive:</em> Verifier sends random $\alpha$.
                        <br />
                        <em>Non-Interactive:</em> Prover calculates {'$\\alpha = \\text{SHA256}(\\text{Merkle Root of Trace})$'}.
                    </p>
                    <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
                        Since the Prover cannot predict the hash of their own work until they finish it, this is just as secure as a random number from an outsider!
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
                <Link to="/resources" className="button">
                    Next: Further Reading
                </Link>
            </div>
        </div>
    );
}
