import React from 'react';
import { AxisConfig, AxisType } from '../App';
import './AxisConfiguration.css';

interface Props {
    mode: '2D' | '3D';
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    zAxis: AxisConfig;
    onXAxisChange: (config: AxisConfig) => void;
    onYAxisChange: (config: AxisConfig) => void;
    onZAxisChange: (config: AxisConfig) => void;
    disabled?: boolean;
}

const axisOptions: { value: AxisType; label: string; description: string }[] = [
    { value: 'R', label: 'R - Stress Ratio', description: 'SH/Sv ratio' },
    { value: 'theta', label: 'θ - Orientation', description: 'Stress field rotation (°)' },
    { value: 'friction', label: 'μ - Friction', description: 'Friction coefficient' },
    { value: 'cohesion', label: 'C - Cohesion', description: 'Cohesive strength (MPa)' },
    { value: 'lambda', label: 'λ - Lambda', description: 'Pore pressure ratio' },
    { value: 'pressure', label: 'P - Pressure', description: 'Pore pressure (MPa)' },
    { value: 'poisson', label: 'ν - Poisson', description: "Poisson's ratio" },
];

const AxisConfiguration: React.FC<Props> = ({
    mode,
    xAxis,
    yAxis,
    zAxis,
    onXAxisChange,
    onYAxisChange,
    onZAxisChange,
    disabled,
}) => {
    const renderAxisControl = (
        axis: 'X' | 'Y' | 'Z',
        config: AxisConfig,
        onChange: (config: AxisConfig) => void
    ) => {
        return (
            <div className="axis-control">
                <h3>{axis} Axis</h3>

                <div className="axis-field">
                    <label>
                        Parameter
                        <select
                            value={config.parameter}
                            onChange={(e) => onChange({ ...config, parameter: e.target.value as AxisType })}
                            disabled={disabled}
                        >
                            {axisOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <span className="axis-description">
                        {axisOptions.find((opt) => opt.value === config.parameter)?.description}
                    </span>
                </div>

                <div className="axis-range">
                    <div className="axis-field">
                        <label>
                            Minimum
                            <input
                                type="number"
                                step="0.01"
                                value={config.min}
                                onChange={(e) => onChange({ ...config, min: Number(e.target.value) })}
                                disabled={disabled}
                            />
                        </label>
                    </div>

                    <div className="axis-field">
                        <label>
                            Maximum
                            <input
                                type="number"
                                step="0.01"
                                value={config.max}
                                onChange={(e) => onChange({ ...config, max: Number(e.target.value) })}
                                disabled={disabled}
                            />
                        </label>
                    </div>
                </div>

                <div className="axis-field">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={config.reverse}
                            onChange={(e) => onChange({ ...config, reverse: e.target.checked })}
                            disabled={disabled}
                        />
                        Reverse direction
                    </label>
                </div>
            </div>
        );
    };

    return (
        <div className="axis-configuration">
            <h2>Axis Configuration</h2>

            {renderAxisControl('X', xAxis, onXAxisChange)}
            {renderAxisControl('Y', yAxis, onYAxisChange)}

            {mode === '3D' && renderAxisControl('Z', zAxis, onZAxisChange)}

            <div className="axis-info">
                <p>
                    <strong>Tip:</strong> Choose different parameters for each axis to explore the parameter space.
                    {mode === '2D' ? ' In 2D mode, other parameters remain fixed.' : ''}
                </p>
            </div>
        </div>
    );
};

export default AxisConfiguration;