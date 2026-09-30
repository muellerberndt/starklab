import React, { useId, useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

interface ExplainerProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function Explainer({ title, children, defaultOpen = false }: ExplainerProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentId = useId();

    return (
        <div className="explainer-card">
            <button
                className="explainer-header"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                aria-expanded={isOpen}
                aria-controls={isOpen ? contentId : undefined}
            >
                <div className="explainer-title">
                    <BookOpen size={16} className="explainer-icon" />
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isOpen && (
                <div className="explainer-content" id={contentId}>
                    {children}
                </div>
            )}
        </div>
    );
}
