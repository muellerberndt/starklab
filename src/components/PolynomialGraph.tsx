

interface PolynomialGraphProps {
    values: number[];
    width?: number;
    height?: number;
    color?: string;
}

export function PolynomialGraph({ values, width = 300, height = 200, color = 'var(--accent-primary)' }: PolynomialGraphProps) {
    if (!values || values.length === 0) {
        return <div style={{ width, height, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Data</div>;
    }

    // Map trace values to coordinates
    // Padding
    const pX = 20;
    const pY = 20;
    const drawWidth = width - pX * 2;
    const drawHeight = height - pY * 2;

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // If effectively zero (for constraints), center the graph
    let min = minVal;
    let max = maxVal;
    if (minVal === 0 && maxVal === 0) {
        min = -1;
        max = 1;
    } else {
        // Add some padding so points aren't on the very edge
        const range = maxVal - minVal || 1;
        min = minVal - range * 0.1;
        max = maxVal + range * 0.1;

        // Ensure we always see 0 line if possible, or at least min/max
        if (min > 0) min = 0;
        if (max < 0) max = 0;
    }

    // Fallback if still flat (e.g. all 5s)
    if (min === max) {
        min -= 1;
        max += 1;
    }

    const range = max - min;

    const points = values.map((val, i) => {
        const x = pX + (i / (values.length - 1 || 1)) * drawWidth;
        const y = (height - pY) - ((val - min) / range) * drawHeight;
        return { x, y };
    });

    // Generate SVG path (simple linear for now, or quadratic bezier)
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        // Simple curve smoothing
        const p0 = points[i - 1];
        const p1 = points[i];
        const midX = (p0.x + p1.x) / 2;
        d += ` Q ${midX} ${p0.y}, ${midX} ${p1.y} T ${p1.x} ${p1.y}`;
    }

    return (
        <div style={{ width, height, border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <svg width="100%" height="100%" style={{ overflow: 'hidden' }}>
                {/* Grid lines */}
                <line x1={pX} y1={height - pY} x2={width - pX} y2={height - pY} stroke="var(--border-color)" strokeWidth="1" />
                <line x1={pX} y1={pY} x2={pX} y2={height - pY} stroke="var(--border-color)" strokeWidth="1" />

                {/* X-axis labels */}
                {points.map((p, i) => (
                    <text
                        key={`x-${i}`}
                        x={p.x}
                        y={height - 5}
                        fill="var(--text-muted)"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {i}
                    </text>
                ))}

                {/* Y-axis labels (min/max) */}
                <text x={5} y={height - pY} fill="var(--text-muted)" fontSize="10" textAnchor="start">{min}</text>
                <text x={5} y={pY + 10} fill="var(--text-muted)" fontSize="10" textAnchor="start">{max}</text>

                <path d={d} fill="none" stroke={color} strokeWidth="3" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
                ))}
            </svg>
        </div>
    );
}
