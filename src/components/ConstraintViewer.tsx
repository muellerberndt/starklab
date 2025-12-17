import type { AirModel } from '../core/air';

interface ConstraintViewerProps {
    air: AirModel;
    failures: { where: string; expr: string; value: number }[];
}

export function ConstraintViewer({ air, failures }: ConstraintViewerProps) {
    const hasFailures = failures.length > 0;

    return (
        <div className="constraint-viewer">
            <h3>AIR Constraints</h3>

            {hasFailures ? (
                <div className="alert error">
                    <h4>Constraints Violated!</h4>
                    <ul>
                        {failures.map((f, i) => (
                            <li key={i}>
                                <strong>{f.where}</strong>: <code>{f.expr}</code> evaluated to {f.value} (expected 0)
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="alert success">
                    All constraints satisfied!
                </div>
            )}

            <div className="constraints-list">
                <h4>Boundary Constraints</h4>
                <p className="muted" style={{ fontSize: '0.9em', marginBottom: '16px' }}>
                    These constraints enforce the initial state of the program (PC=0, registers=0).
                </p>
                <ul>
                    {air.boundary.map((c) => (
                        <li key={c.id} className="constraint-item">
                            <div className="constraint-expr">
                                <code>{c.expr}</code>
                            </div>
                            <div className="constraint-why">
                                {c.why}
                            </div>
                        </li>
                    ))}
                </ul>

                <h4 style={{ marginTop: '32px' }}>Transition Constraints</h4>
                <p className="muted" style={{ fontSize: '0.9em', marginBottom: '16px' }}>
                    These constraints must hold for every step of the execution. They enforce the logic of instructions.
                </p>
                {air.transitions.map((t, i) => (
                    <div key={i} className="transition-group">
                        <h5>Step {t.stepIndex}: <code>{t.source.text}</code></h5>
                        <ul>
                            {t.constraints.map((c) => (
                                <li key={c.id} className="constraint-item">
                                    <div className="constraint-expr">
                                        <code>{c.expr}</code>
                                    </div>
                                    <div className="constraint-why">
                                        {c.why}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

        </div>
    );
}
