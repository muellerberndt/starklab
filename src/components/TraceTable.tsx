import type { TraceRow } from '../core/vm';

interface TraceTableProps {
    trace: TraceRow[];
    regNames: string[];
}

export function TraceTable({ trace, regNames }: TraceTableProps) {
    if (trace.length === 0) return null;

    return (
        <div className="trace-table-container">
            <table className="trace-table">
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>pc</th>
                        <th>halted</th>
                        {regNames.map((r) => (
                            <th key={r}>{r}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {trace.map((row, i) => (
                        <tr key={i}>
                            <td>{i}</td>
                            <td>{row.pc}</td>
                            <td>{row.halted}</td>
                            {regNames.map((r) => (
                                <td key={r}>{row.regs[r] ?? 0}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
