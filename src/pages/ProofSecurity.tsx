export function ProofSecurityPage() {
    const attacks = [
        {
            title: 'Submit a Fake Quotient Polynomial',
            attack: 'What if I just submit Q(x) = 0 everywhere, or some arbitrary polynomial that happens to divide cleanly by Z(x)?',
            defense: 'The Quotient Check',
            explanation: (
                <>
                    <p>
                        The verifier doesn't just check that Q(x) exists. At random query points z, the verifier computes:
                    </p>
                    <div style={{
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        margin: '16px 0',
                        fontSize: '1.1em',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px'
                    }}>
                        H(z) = Q(z) × Z(z)
                    </div>
                    <p>
                        <strong>The key:</strong> H(z) is computed from the trace polynomials that the prover already committed to.
                        The prover cannot change the trace after seeing the query positions (thanks to Fiat-Shamir).
                    </p>
                    <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>If the trace doesn't satisfy constraints, H(z) ≠ 0 at trace points</li>
                        <li>If H(x) isn't zero at trace points, it's not divisible by Z(x)</li>
                        <li>Any fake Q(x) will fail the check at random points</li>
                    </ul>
                </>
            ),
        },
        {
            title: 'Use a High-Degree Polynomial',
            attack: 'I\'ll construct a high-degree polynomial that passes through the correct values at query points, but is wrong everywhere else.',
            defense: 'FRI Protocol',
            explanation: (
                <>
                    <p>
                        The FRI protocol proves that Q(x) has low degree through repeated folding rounds.
                        The verifier checks that the polynomial maintains consistent structure at each layer.
                    </p>
                    <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>A low-degree polynomial folds consistently — each layer is half the size</li>
                        <li>A high-degree polynomial produces inconsistencies during folding</li>
                        <li>Random queries at each FRI layer catch these inconsistencies</li>
                    </ul>
                </>
            ),
        },
        {
            title: 'Cheat at Positions Not Queried',
            attack: 'The verifier only checks a few random positions. I\'ll make sure those are correct but cheat everywhere else.',
            defense: 'Error Amplification + Random Queries',
            explanation: (
                <>
                    <p>Two properties combine to make this impossible:</p>
                    <ol style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>
                            <strong>Error Amplification:</strong> Cheating at even one trace position causes
                            the polynomial to differ at most positions in the LDE domain. A single lie pollutes
                            the entire polynomial.
                        </li>
                        <li>
                            <strong>Commitment Before Challenge:</strong> The prover commits via Merkle tree
                            before knowing query positions. Fiat-Shamir derives positions from the commitment hash.
                        </li>
                        <li>
                            <strong>Random Sampling:</strong> With a 4x blowup, cheating at 1% of positions means
                            ~1% of the LDE is wrong. With k queries, detection probability approaches 1 - (0.99)^k.
                        </li>
                    </ol>
                </>
            ),
        },
        {
            title: 'Predict the Query Positions',
            attack: 'If I know which positions will be queried before I commit, I can craft my commitment to pass those specific checks.',
            defense: 'Fiat-Shamir Transform',
            explanation: (
                <>
                    <p>Query positions are derived by hashing the prover's own commitments:</p>
                    <div style={{
                        margin: '16px 0',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        fontSize: '0.95em'
                    }}>
                        query_positions = Hash(trace_commitment || quotient_commitment || ...)
                    </div>
                    <p>
                        The prover cannot know query positions until after committing, because positions
                        depend on the commitment hash. Changing the commitment to "fix" bad positions
                        changes the hash, which changes the positions — an unsolvable circular dependency.
                    </p>
                </>
            ),
        },
        {
            title: 'Forge Merkle Proofs',
            attack: 'I committed to wrong values, but I\'ll provide fake Merkle proofs showing "correct" values at query positions.',
            defense: 'Collision-Resistant Hashing',
            explanation: (
                <>
                    <p>
                        Merkle trees use cryptographic hash functions (SHA-256, Blake2, etc.).
                        Finding two different values with the same hash is computationally
                        infeasible — the <strong>collision resistance</strong> property.
                    </p>
                    <p style={{ marginTop: '12px' }}>
                        To forge a Merkle proof, you'd need a different value that hashes up the tree
                        to the same root. This requires breaking collision resistance, which is believed
                        impossible for secure hash functions.
                    </p>
                </>
            ),
        },
    ];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>6.5 Proof Security</h1>
            <p className="intro">
                Why can't a dishonest prover cheat the system? Let's examine potential attacks and the defenses that prevent them.
            </p>

            {attacks.map((item, index) => (
                <div
                    key={index}
                    className="card"
                    style={{ marginTop: '32px' }}
                >
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '24px',
                    }}>
                        {/* Left: Attack */}
                        <div style={{
                            padding: '20px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            borderLeft: '3px solid var(--accent-error)',
                        }}>
                            <div style={{
                                fontSize: '0.75em',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--accent-error)',
                                marginBottom: '8px',
                            }}>
                                Attack
                            </div>
                            <h3 style={{ margin: '0 0 12px 0' }}>{item.title}</h3>
                            <p style={{
                                margin: 0,
                                fontStyle: 'italic',
                                color: 'var(--text-muted)',
                            }}>
                                "{item.attack}"
                            </p>
                        </div>

                        {/* Right: Defense */}
                        <div style={{
                            padding: '20px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            borderLeft: '3px solid var(--accent-success)',
                        }}>
                            <div style={{
                                fontSize: '0.75em',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--accent-success)',
                                marginBottom: '8px',
                            }}>
                                Defense
                            </div>
                            <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent-success)' }}>
                                {item.defense}
                            </h4>
                            <div style={{ fontSize: '0.95em', lineHeight: '1.6' }}>
                                {item.explanation}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
