import React from 'react';
import { Parameters } from '../App';
import './ParameterPanel.css';

interface Props {
    parameters: Parameters;
    onChange: (params: Parameters) => void;
    disabled?: boolean;
}

const ParameterPanel: React.FC<Props> = ({ parameters, onChange, disabled }) => {
    const handleChange = (field: keyof Parameters, value: number | string) => {
        onChange({ ...parameters, [field]: value });
    };

    return (
        <div className="parameter-panel">
            <h2>Parameters</h2>

            <div className="param-group">
                <h3>Mechanical Properties</h3>

                <div className="param-field">
                    <label>
                        Friction Coefficient (μ)
                        <input
                            type="number"
                            step="0.01"
                            value={parameters.friction}
                            onChange={(e) => handleChange('friction', Number(e.target.value))}
                            disabled={disabled}
                        />
                    </label>
                    <span className="param-hint">Typical range: 0.4 - 0.9</span>
                </div>

                <div className="param-field">
                    <label>
                        Cohesion (MPa)
                        <input
                            type="number"
                            step="0.1"
                            value={parameters.cohesion}
                            onChange={(e) => handleChange('cohesion', Number(e.target.value))}
                            disabled={disabled}
                        />
                    </label>
                    <span className="param-hint">Rock cohesive strength</span>
                </div>

                <div className="param-field">
                    <label>
                        Lambda (λ)
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={parameters.lambda}
                            onChange={(e) => handleChange('lambda', Number(e.target.value))}
                            disabled={disabled}
                        />
                    </label>
                    <span className="param-hint">Pore pressure ratio: 0-1</span>
                </div>

                <div className="param-field">
                    <label>
                        Poisson's Ratio (ν)
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="0.5"
                            value={parameters.poisson}
                            onChange={(e) => handleChange('poisson', Number(e.target.value))}
                            disabled={disabled}
                        />
                    </label>
                    <span className="param-hint">Typical: 0.2 - 0.3</span>
                </div>

                <div className="param-field">
                    <label>
                        Pore Pressure (MPa)
                        <input
                            type="number"
                            step="0.1"
                            value={parameters.pressure}
                            onChange={(e) => handleChange('pressure', Number(e.target.value))}
                            disabled={disabled}
                        />
                    </label>
                    <span className="param-hint">Fluid pressure</span>
                </div>
            </div>

            <div className="param-group">
                <h3>Stress Field</h3>

                <div className="param-field">
                    <label>
                        Maximum Horizontal Stress (SH)
                        <input
                            type="text"
                            value={parameters.SH}
                            onChange={(e) => handleChange('SH', e.target.value)}
                            disabled={disabled}
                            placeholder="e.g., 50 or x*0.5+20"
                        />
                    </label>
                    <span className="param-hint">Expression or constant (MPa)</span>
                </div>

                <div className="param-field">
                    <label>
                        Minimum Horizontal Stress (Sh)
                        <input
                            type="text"
                            value={parameters.Sh}
                            onChange={(e) => handleChange('Sh', e.target.value)}
                            disabled={disabled}
                            placeholder="e.g., 30 or x*0.3+10"
                        />
                    </label>
                    <span className="param-hint">Expression or constant (MPa)</span>
                </div>

                <div className="param-field">
                    <label>
                        Vertical Stress (Sv)
                        <input
                            type="text"
                            value={parameters.Sv}
                            onChange={(e) => handleChange('Sv', e.target.value)}
                            disabled={disabled}
                            placeholder="e.g., z*0.025 (depth dependent)"
                        />
                    </label>
                    <span className="param-hint">Expression or constant (MPa)</span>
                </div>

                <div className="param-field">
                    <label>
                        Stress Rotation (θ°)
                        <input
                            type="number"
                            step="1"
                            min="0"
                            max="360"
                            value={parameters.theta}
                            onChange={(e) => handleChange('theta', Number(e.target.value))}
                            disabled={disabled}
                        />
                    </label>
                    <span className="param-hint">Horizontal stress rotation</span>
                </div>
            </div>

            <div className="param-info">
                <p><strong>Note:</strong> Stress expressions can use variables x, y, z for spatial dependence.</p>
            </div>
        </div>
    );
};

export default ParameterPanel;