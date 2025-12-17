import React, { useState, useEffect } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
}

export function CodeEditor({ value, onChange, error }: CodeEditorProps) {
    const [lines, setLines] = useState(1);

    useEffect(() => {
        setLines(value.split('\n').length);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newValue = value.substring(0, start) + '    ' + value.substring(end);
            onChange(newValue);
            // We need to set the cursor position after the state update, 
            // but React state updates are async. 
            // For a simple implementation, we might lose cursor position on tab.
            // A more robust solution would use a ref.
            setTimeout(() => {
                if (e.target instanceof HTMLTextAreaElement) {
                    e.target.selectionStart = e.target.selectionEnd = start + 4;
                }
            }, 0);
        }
    };

    return (
        <div className="code-editor-container">
            <div className="line-numbers">
                {Array.from({ length: Math.max(lines, 10) }).map((_, i) => (
                    <div key={i} className="line-number">
                        {i + 1}
                    </div>
                ))}
            </div>
            <textarea
                className="code-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
            />
            {error && <div className="editor-error">{error}</div>}
        </div>
    );
}
