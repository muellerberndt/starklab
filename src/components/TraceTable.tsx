import type { TraceRow } from '../core/vm';

interface TraceTableProps {
    trace: TraceRow[];
    regNames: string[];
    maskValues?: boolean;
}

export function TraceTable({ trace, regNames, maskValues = false }: TraceTableProps) {
    if (trace.length === 0) return null;

    return (
        <div className="trace-table-container" tabIndex={0} role="region" aria-label="Execution trace table">
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
                            <td>{maskValues ? '•••' : row.pc}</td>
                            <td>{maskValues ? '•••' : row.halted}</td>
                            {regNames.map((r) => (
                                <td key={r}>{maskValues ? '•••' : (row.regs[r] ?? 0)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
