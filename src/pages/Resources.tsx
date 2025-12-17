import { ExternalLink } from 'lucide-react';

export function ResourcesPage() {
    const resources = [
        {
            title: "Scalable, transparent, and post-quantum secure computational integrity",
            authors: "Eli Ben-Sasson, Iddo Bentov, Yinon Horesh, Michael Riabzev",
            description: "The original paper introducing STARKs. It details the construction of the proof system, including AIR and FRI.",
            link: "https://eprint.iacr.org/2018/046.pdf"
        },
        {
            title: "Fast Reed-Solomon Interactive Oracle Proofs of Proximity",
            authors: "Eli Ben-Sasson, Iddo Bentov, Yossi Oren, Michael Riabzev",
            description: "The paper defining the FRI protocol, which is used to prove that a committed function is close to a low-degree polynomial.",
            link: "https://eccc.weizmann.ac.il/report/2017/134/"
        },
        {
            title: "STARKs, Part I: Proofs with Polynomials",
            authors: "Vitalik Buterin",
            description: "An excellent blog series by Vitalik Buterin that builds intuition for STARKs using simple examples.",
            link: "https://vitalik.eth.limo/general/2017/11/09/starks_part_1.html"
        },
        {
            title: "Anatomy of a STARK",
            authors: "Alan Szepieniec",
            description: "A comprehensive, step-by-step tutorial on implementing a STARK prover and verifier from scratch.",
            link: "https://aszepieniec.github.io/stark-anatomy/"
        },
        {
            title: "EthSTARK Documentation",
            authors: "StarkWare",
            description: "Documentation for the EthSTARK protocol, providing technical details on the specific instantiation used in practice.",
            link: "https://docs.starkware.co/starkex/eth-stark-documentation.html"
        },
        {
            title: "MoonMath Manual",
            authors: "Least Authority",
            description: "A comprehensive guide to zk-SNARKs and STARKs, designed to be accessible to a broad audience.",
            link: "https://github.com/LeastAuthority/moonmath-manual"
        },
        {
            title: "RareSkills ZK Book",
            authors: "RareSkills",
            description: "An in-depth technical resource for learning Zero Knowledge Proofs, covering both theory and implementation.",
            link: "https://rareskills.io/zk-book"
        }
    ];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1>Further Reading</h1>
            <p>
                Want to dive deeper? Here are the original papers and some of the best resources for learning about STARKs.
            </p>

            <div style={{ display: 'grid', gap: '24px', marginTop: '32px' }}>
                {resources.map((res, i) => (
                    <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2em' }}>
                                <a
                                    href={res.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {res.title}
                                    <ExternalLink size={16} />
                                </a>
                            </h3>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9em', fontStyle: 'italic' }}>
                            {res.authors}
                        </div>
                        <p style={{ margin: 0 }}>
                            {res.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
