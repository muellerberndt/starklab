import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const steps = [
    { number: '01', title: 'Execute', to: '/trace/', text: 'Write a small program and inspect every step in its trace.' },
    { number: '02', title: 'Encode', to: '/polynomials/', text: 'Turn that trace into polynomials and algebraic constraints.' },
    { number: '03', title: 'Commit', to: '/commitments/', text: 'Bind the data with Merkle trees and explore FRI folding.' },
    { number: '04', title: 'Verify', to: '/verify/', text: 'Generate a proof, change its contents and test the checks.' },
];

export function Home() {
    return <>
        <section className="home-hero"><p className="eyebrow">STARK Lab / Pragma Research</p><h1>See how a proof is built.</h1><p className="lead">An interactive guide to STARK proofs. Write a program, follow its execution and explore how a verifier checks the result.</p><div className="home-actions"><Link to="/math/" className="btn">Start the tutorial <ArrowRight size={18} /></Link><Link to="/trace/" className="btn btn-ghost">Open the playground <ArrowRight size={18} /></Link></div></section>
        <nav className="home-chain" aria-label="Explore the proof stages">{steps.map(step => <Link to={step.to} key={step.number}><span>{step.number} /</span><h3>{step.title}</h3><p>{step.text}</p></Link>)}</nav>
        <section className="home-note"><h2>Learn by changing the inputs.</h2><p>Start with the Fibonacci example or write a program of your own. Explore finite fields, execution traces, constraints, polynomial encoding, Merkle commitments and FRI. The lessons share your program as you move between them.</p><p>STARK stands for Scalable Transparent Argument of Knowledge. This teaching implementation includes a toy prover and verifier with Fiat–Shamir challenges, Merkle commitments and FRI queries. It is a place to inspect the mechanisms, not a production proof system.</p></section>
    </>;
}
