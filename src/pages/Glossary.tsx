import { useState } from 'react';
import { Search } from 'lucide-react';

type GlossaryEntry = {
    term: string;
    definition: string;
    link?: string;
    category: 'core' | 'polynomial' | 'crypto' | 'fri' | 'protocol' | 'math' | 'security';
};

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
    // Core STARK Components
    {
        term: 'STARK',
        definition: 'Scalable Transparent Argument of Knowledge. A proof system that is scalable (verification time grows logarithmically), transparent (no trusted setup), and post-quantum secure.',
        link: 'https://eprint.iacr.org/2018/046.pdf',
        category: 'core',
    },
    {
        term: 'AIR',
        definition: 'Algebraic Intermediate Representation. The mathematical specification of a computation, consisting of a trace layout and constraint equations that valid executions must satisfy.',
        link: 'https://medium.com/starkware/arithmetization-i-15c046390862',
        category: 'core',
    },
    {
        term: 'Execution Trace',
        definition: 'A table recording the state of a computation at each step. Rows represent time steps, columns represent registers or state variables. The prover encodes this as polynomials.',
        category: 'core',
    },
    {
        term: 'Prover',
        definition: 'The party that executes a computation and generates a proof of its correctness. Must commit to polynomial values before seeing verifier challenges.',
        category: 'core',
    },
    {
        term: 'Verifier',
        definition: 'The party that checks the proof without re-executing the computation. Performs spot-checks at random positions and verifies FRI folding consistency.',
        category: 'core',
    },

    // Polynomial Concepts
    {
        term: 'Trace Polynomial',
        definition: 'A polynomial T(x) constructed via Lagrange interpolation such that T(i) equals the trace value at step i. Each column of the trace becomes its own polynomial.',
        category: 'polynomial',
    },
    {
        term: 'Constraint Polynomial',
        definition: 'A polynomial C(x) derived by substituting trace polynomials into constraint equations. Equals zero at all trace points if and only if constraints are satisfied.',
        category: 'polynomial',
    },
    {
        term: 'Composition Polynomial',
        definition: 'H(x) = Σ αᵢ·Cᵢ(x). A random linear combination of all constraint polynomials. If any constraint fails, H(x) ≠ 0 at that point.',
        category: 'polynomial',
    },
    {
        term: 'Quotient Polynomial',
        definition: 'Q(x) = H(x) / Z(x). If constraints are satisfied, H(x) is divisible by the vanishing polynomial, yielding Q(x). The prover commits to Q(x) and the verifier checks H(z) = Q(z)·Z(z).',
        category: 'polynomial',
    },
    {
        term: 'Vanishing Polynomial',
        definition: 'Z(x) = xⁿ - 1 (or product of (x - ωⁱ) for trace domain). Zero exactly at the trace evaluation points. Used to check that constraints vanish on the trace domain.',
        category: 'polynomial',
    },
    {
        term: 'Low-Degree Extension (LDE)',
        definition: 'Evaluating a polynomial on a larger domain (typically 4-16x). Enables random spot-checking: if the prover cheats on even one point, the error spreads across most of the LDE.',
        category: 'polynomial',
    },
    {
        term: 'Blowup Factor',
        definition: 'The ratio between LDE domain size and trace domain size. Higher blowup increases security but also proof size. Common values are 4, 8, or 16.',
        category: 'polynomial',
    },
    {
        term: 'Lagrange Interpolation',
        definition: 'A method to construct the unique polynomial of degree n-1 that passes through n given points. Uses basis polynomials that are 1 at one point and 0 at all others.',
        link: 'https://en.wikipedia.org/wiki/Lagrange_polynomial',
        category: 'polynomial',
    },
    {
        term: 'Degree Bound',
        definition: 'The maximum allowed degree for a polynomial. FRI proves that the quotient polynomial respects its degree bound, confirming it arose from valid constraint satisfaction.',
        category: 'polynomial',
    },

    // Cryptographic Primitives
    {
        term: 'Merkle Tree',
        definition: 'A binary tree of hashes where each parent is the hash of its children. The root commits to all leaf values; individual leaves can be opened with O(log n) proof size.',
        link: 'https://en.wikipedia.org/wiki/Merkle_tree',
        category: 'crypto',
    },
    {
        term: 'Merkle Root',
        definition: 'The single hash at the top of a Merkle tree. Commits the prover to all polynomial evaluations; changing any value changes the root.',
        category: 'crypto',
    },
    {
        term: 'Merkle Path',
        definition: 'The sequence of sibling hashes from a leaf to the root. Proves that a specific value exists at a position in the committed tree.',
        category: 'crypto',
    },
    {
        term: 'Commitment',
        definition: 'A binding promise to specific values (via Merkle root). Once committed, the prover cannot change values without detection. Commitments are sent before challenges.',
        category: 'crypto',
    },
    {
        term: 'Hash Function',
        definition: 'A one-way function mapping arbitrary input to fixed-size output. Used for commitments and deriving random challenges. Must be collision-resistant.',
        link: 'https://en.wikipedia.org/wiki/Cryptographic_hash_function',
        category: 'crypto',
    },
    {
        term: 'Collision Resistance',
        definition: 'Property of hash functions: computationally infeasible to find two different inputs with the same hash. Prevents forging Merkle proofs.',
        category: 'crypto',
    },

    // FRI Protocol
    {
        term: 'FRI',
        definition: 'Fast Reed-Solomon Interactive Oracle Proof of Proximity. A protocol that proves a committed function is close to a low-degree polynomial through iterative folding.',
        link: 'https://eccc.weizmann.ac.il/report/2017/134/',
        category: 'fri',
    },
    {
        term: 'Folding',
        definition: 'Reducing polynomial domain by half using a random challenge β. Each fold: Q\'[i] = Q[i] + β·Q[i + n/2]. Repeated until reaching a constant.',
        category: 'fri',
    },
    {
        term: 'FRI Layer',
        definition: 'Each stage of the folding process. The prover commits to each layer; the verifier checks consistency between layers at random positions.',
        category: 'fri',
    },
    {
        term: 'Reed-Solomon Code',
        definition: 'An error-correcting code based on polynomial evaluation. FRI leverages its structure: low-degree polynomials have predictable relationships that high-degree fakes cannot match.',
        link: 'https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction',
        category: 'fri',
    },
    {
        term: 'IOP',
        definition: 'Interactive Oracle Proof. A proof model where the verifier has oracle access to prover messages and can query them at chosen positions. FRI is an IOP.',
        category: 'fri',
    },

    // Protocol Mechanics
    {
        term: 'Fiat-Shamir Transform',
        definition: 'A technique to make interactive protocols non-interactive. Random challenges are derived by hashing the transcript so far. The prover cannot predict challenges before committing.',
        link: 'https://en.wikipedia.org/wiki/Fiat%E2%80%93Shamir_heuristic',
        category: 'protocol',
    },
    {
        term: 'Challenge',
        definition: 'A random value (α, β, etc.) used to combine polynomials or fold domains. Derived via Fiat-Shamir from previous commitments to ensure unpredictability.',
        category: 'protocol',
    },
    {
        term: 'Query',
        definition: 'A random position where the verifier checks polynomial values. Multiple queries increase security exponentially.',
        category: 'protocol',
    },
    {
        term: 'Transcript',
        definition: 'The complete record of prover messages and commitments. Hashed to derive challenges, ensuring all randomness depends on prior commitments.',
        category: 'protocol',
    },
    {
        term: 'Decommitment',
        definition: 'Opening committed values at queried positions. Includes the value and Merkle path proving it matches the committed root.',
        category: 'protocol',
    },
    {
        term: 'Boundary Constraint',
        definition: 'Constraints on specific trace positions, typically initial or final states. Example: "r0 at step 0 must equal 0."',
        category: 'protocol',
    },
    {
        term: 'Transition Constraint',
        definition: 'Constraints relating consecutive trace rows. Example: "r0(next) = r0(current) + 2." Checked at all steps.',
        category: 'protocol',
    },

    // Mathematical Concepts
    {
        term: 'Finite Field',
        definition: 'A set of numbers {0, 1, ..., p-1} with addition and multiplication modulo prime p. All STARK arithmetic happens in finite fields to ensure exact computation.',
        link: 'https://en.wikipedia.org/wiki/Finite_field',
        category: 'math',
    },
    {
        term: 'Prime Field',
        definition: 'A finite field with p elements where p is prime. Field elements are integers modulo p. The field prime in this demo is 97.',
        category: 'math',
    },
    {
        term: 'Field Element',
        definition: 'An individual number in a finite field. All trace values, polynomial coefficients, and computations use field elements.',
        category: 'math',
    },
    {
        term: 'Modular Arithmetic',
        definition: 'Arithmetic where results wrap around at a modulus. For field Fₚ: (a + b) mod p, (a × b) mod p. Ensures all values stay within the field.',
        link: 'https://en.wikipedia.org/wiki/Modular_arithmetic',
        category: 'math',
    },
    {
        term: 'Roots of Unity',
        definition: 'Field elements ω where ωⁿ = 1. Form a cyclic group used as evaluation points. Enable efficient polynomial operations via FFT/NTT.',
        link: 'https://en.wikipedia.org/wiki/Root_of_unity',
        category: 'math',
    },
    {
        term: 'Primitive Root',
        definition: 'A generator g of the multiplicative group Fₚ*. Powers of g cycle through all nonzero field elements. Used to find roots of unity.',
        category: 'math',
    },

    // Security Properties
    {
        term: 'Soundness',
        definition: 'The property that a cheating prover cannot convince an honest verifier except with negligible probability. STARK soundness is based on polynomial identity testing.',
        category: 'security',
    },
    {
        term: 'Completeness',
        definition: 'The property that an honest prover with a valid computation can always convince an honest verifier. Honest execution always produces an accepting proof.',
        category: 'security',
    },
    {
        term: 'Zero-Knowledge',
        definition: 'The property that the verifier learns nothing beyond the truth of the statement. Achieved by adding random blinding polynomials to the trace.',
        category: 'security',
    },
    {
        term: 'Transparent',
        definition: 'A proof system requiring no trusted setup—only public randomness (hash functions). Anyone can verify setup parameters. Contrast with SNARKs requiring trusted ceremonies.',
        category: 'security',
    },
    {
        term: 'Post-Quantum Secure',
        definition: 'Resistant to attacks by quantum computers. STARKs use hash-based security rather than elliptic curves, which quantum algorithms can break.',
        category: 'security',
    },
    {
        term: 'Error Amplification',
        definition: 'The property that cheating at one point causes errors at many LDE points. Low-degree polynomials that differ at one point differ at most points.',
        category: 'security',
    },
    {
        term: 'Succinctness',
        definition: 'Proof size grows polylogarithmically with computation size. A proof for 1 million steps is only slightly larger than for 1000 steps.',
        category: 'security',
    },
];

const CATEGORY_LABELS: Record<string, string> = {
    core: 'Core Concepts',
    polynomial: 'Polynomials',
    crypto: 'Cryptographic Primitives',
    fri: 'FRI Protocol',
    protocol: 'Protocol Mechanics',
    math: 'Mathematical Foundations',
    security: 'Security Properties',
};

const CATEGORY_COLORS: Record<string, string> = {
    core: 'var(--accent-primary)',
    polynomial: 'var(--accent-secondary)',
    crypto: '#f1c40f',
    fri: '#e74c3c',
    protocol: '#9b59b6',
    math: '#1abc9c',
    security: 'var(--accent-success)',
};

export function GlossaryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredEntries = GLOSSARY_ENTRIES.filter(entry => {
        const matchesSearch = searchTerm === '' ||
            entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === null || entry.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(GLOSSARY_ENTRIES.map(e => e.category))];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Glossary</h1>
            <p className="intro">
                A comprehensive reference of STARK terminology and concepts used throughout this tutorial.
            </p>

            {/* Search and Filter */}
            <div className="card" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search terms..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1em',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            style={{
                                padding: '6px 12px',
                                background: selectedCategory === null ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                border: 'none',
                                borderRadius: '16px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                            }}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: '6px 12px',
                                    background: selectedCategory === cat ? CATEGORY_COLORS[cat] : 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    borderRadius: '16px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.85em',
                                }}
                            >
                                {CATEGORY_LABELS[cat]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                Showing {filteredEntries.length} of {GLOSSARY_ENTRIES.length} terms
            </div>

            {/* Glossary Entries */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredEntries.map((entry) => (
                    <div
                        key={entry.term}
                        className="card"
                        style={{
                            borderLeft: `4px solid ${CATEGORY_COLORS[entry.category]}`,
                            padding: '20px',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', color: CATEGORY_COLORS[entry.category] }}>
                                    {entry.term}
                                </h3>
                                <p style={{ margin: 0, lineHeight: '1.6' }}>
                                    {entry.definition}
                                </p>
                            </div>
                            {entry.link && (
                                <a
                                    href={entry.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '4px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '4px',
                                        color: 'var(--accent-primary)',
                                        fontSize: '0.85em',
                                        textDecoration: 'none',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Learn more →
                                </a>
                            )}
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    background: `${CATEGORY_COLORS[entry.category]}22`,
                                    borderRadius: '4px',
                                    fontSize: '0.75em',
                                    color: CATEGORY_COLORS[entry.category],
                                }}
                            >
                                {CATEGORY_LABELS[entry.category]}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredEntries.length === 0 && (
                <div className="card" style={{ marginTop: '24px', textAlign: 'center', padding: '48px' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        No terms found matching "{searchTerm}"
                    </p>
                </div>
            )}
        </div>
    );
}
