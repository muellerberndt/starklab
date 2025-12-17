import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    BookOpen,
    Calculator,
    Cpu,
    Database,
    Layers,
    Search,
    ShieldCheck,
    Menu,
    X,
    MessageSquare,
    GitCommit
} from 'lucide-react';
import './Layout.css';

export function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { to: "/", icon: BookOpen, label: "Introduction" },
        { to: "/math", icon: Calculator, label: "Basics I: Fields & Trees" },
        { to: "/encoding", icon: GitCommit, label: "Basics II: Encoding" },
        { to: "/constraint-eval", icon: GitCommit, label: "Basics III: Constraints" },
        { to: "/protocol", icon: MessageSquare, label: "Protocol Overview" },
        { to: "/trace", icon: Cpu, label: "1. Trace & AIR" },
        { to: "/polynomials", icon: Layers, label: "1.5 Polynomials" },
        { to: "/commitments", icon: Database, label: "2. Commitments" },
        { to: "/composition", icon: Layers, label: "3. Composition" },
        { to: "/fri", icon: Search, label: "4. FRI" },
        { to: "/zk", icon: ShieldCheck, label: "5. Zero-Knowledge" },
        { to: "/verify", icon: ShieldCheck, label: "6. Proof Check" },
        { to: "/faq", icon: MessageSquare, label: "FAQ" },
        { to: "/resources", icon: BookOpen, label: "Further Reading" },
    ];

    return (
        <div className="layout">
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''} `}>
                <div className="sidebar-header">
                    <span className="logo">STARK Lab</span>
                    <button
                        className="close-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{ display: 'none' }} // Only show on mobile via CSS if needed, but CSS handles visibility of sidebar itself
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="main-content">
                <header className="mobile-header">
                    <button
                        className="menu-btn"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <span className="logo" style={{ marginLeft: '16px' }}>STARK Lab</span>
                </header>

                <main className="content-scroll">
                    <div className="content-container">
                        <Outlet />

                        <footer style={{
                            marginTop: '64px',
                            paddingTop: '32px',
                            borderTop: '1px solid var(--border-color)',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.9em'
                        }}>
                            <p>
                                (c) Bernhard Mueller • <a href="https://twitter.com/muellerberndt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>@muellerberndt</a>
                            </p>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}
