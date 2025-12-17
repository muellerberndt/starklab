import { FiniteFieldExplainer } from '../components/FiniteFieldExplainer';
import { MerkleTreeExplainer } from '../components/MerkleTreeExplainer';
import { Explainer } from '../components/Explainer';

export function MathPage() {
    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Basics I: Fields & Trees</h1>
            <p>
                Before diving into STARKs, we need to understand the mathematical and cryptographic primitives they are built on.
            </p>

            <div style={{ marginTop: '48px' }}>
                <h2>Finite Fields</h2>
                <p>
                    STARKs don't operate on regular numbers (like 1, 2, 3.5). They operate on <strong>Finite Fields</strong>.
                    A finite field is a set of numbers with a limited size (defined by a prime number <code>P</code>).
                    All arithmetic operations (addition, multiplication) are performed <strong>modulo P</strong>.
                </p>

                <Explainer title="Why do we use Finite Fields?">
                    <p>
                        <strong>1. Precision:</strong> Regular floating-point numbers (like 3.14) have rounding errors.
                        Finite fields use integers, so calculations are always exact.
                    </p>
                    <p>
                        <strong>2. Security:</strong> In cryptography, we need mathematical problems that are "hard" to solve
                        (like finding discrete logarithms). These problems are much harder in finite fields than in real numbers.
                    </p>
                    <p>
                        <strong>3. Size:</strong> By choosing a large prime P, we can ensure the numbers never get "too big"
                        for the computer to handle efficiently, while still having a huge space of possible values.
                    </p>
                </Explainer>

                <FiniteFieldExplainer />
            </div>

            <div style={{ marginTop: '64px' }}>
                <h2>Merkle Trees</h2>
                <p>
                    A <strong>Merkle Tree</strong> is a way to "commit" to a large amount of data using a single small string (the <strong>Root</strong>).
                    It allows us to prove that a specific piece of data belongs to the set without revealing the entire set.
                </p>

                <Explainer title="How does a Merkle Tree work?">
                    <p>
                        1. <strong>Leaves:</strong> We start by hashing our data chunks (the "leaves").
                    </p>
                    <p>
                        2. <strong>Pairs:</strong> We group the hashes into pairs and hash them together to form a parent node.
                    </p>
                    <p>
                        3. <strong>Root:</strong> We repeat this process until we have a single hash at the top: the <strong>Merkle Root</strong>.
                    </p>
                    <p>
                        If you change even a single character in one of the messages, the change propagates all the way up to the root,
                        completely changing it. This makes the root a unique "fingerprint" of the entire dataset.
                    </p>
                </Explainer>

                <MerkleTreeExplainer />
            </div>
        </div>
    );
}
