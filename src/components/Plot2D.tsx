import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { AxisConfig } from '../App';
import type { Square } from '../RuptureEnvelop';
import './Plot2D.css';

interface Props {
    data: Square;
    xAxis: AxisConfig;
    yAxis: AxisConfig;
}

const Plot2D: React.FC<Props> = ({ data, xAxis, yAxis }) => {
    const plotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!plotRef.current || !data) return;

        // Reshape 1D data array into 2D matrix
        const z: number[][] = [];
        for (let j = 0; j < data.dimY; j++) {
            const row: number[] = [];
            for (let i = 0; i < data.dimX; i++) {
                const index = j * data.dimX + i;
                row.push(data.domain[index]);
            }
            z.push(row);
        }

        // Generate axis values
        const xValues: number[] = [];
        const yValues: number[] = [];

        for (let i = 0; i < data.dimX; i++) {
            if (xAxis.reverse) {
                xValues.push(xAxis.min + (data.dimX - 1 - i) * (xAxis.max - xAxis.min) / (data.dimX - 1));
            } else {
                xValues.push(xAxis.min + i * (xAxis.max - xAxis.min) / (data.dimX - 1));
            }
        }

        for (let j = 0; j < data.dimY; j++) {
            if (yAxis.reverse) {
                yValues.push(yAxis.min + (data.dimY - 1 - j) * (yAxis.max - yAxis.min) / (data.dimY - 1));
            } else {
                yValues.push(yAxis.min + j * (yAxis.max - yAxis.min) / (data.dimY - 1));
            }
        }

        const plotData: Plotly.Data[] = [
            {
                type: 'heatmap',
                x: xValues,
                y: yValues,
                z: z,
                colorscale: [
                    [0, 'rgb(5, 10, 172)'],
                    [0.35, 'rgb(40, 60, 190)'],
                    [0.5, 'rgb(70, 100, 245)'],
                    [0.6, 'rgb(90, 120, 245)'],
                    [0.7, 'rgb(106, 137, 247)'],
                    [1, 'rgb(220, 220, 220)'],
                ],
                colorbar: {
                    title: 'Rupture<br>Energy',
                    titleside: 'right',
                    thickness: 20,
                    len: 0.7,
                },
                hovertemplate: `${getAxisLabel(xAxis)}: %{x:.3f}<br>${getAxisLabel(yAxis)}: %{y:.3f}<br>Energy: %{z:.4f}<extra></extra>`,
            },
        ];

        const layout: Partial<Plotly.Layout> = {
            title: {
                text: 'Rupture Envelope - 2D Analysis',
                font: { size: 18, color: '#2d3748' },
            },
            xaxis: {
                title: getAxisLabel(xAxis),
                titlefont: { size: 14 },
                showgrid: true,
                zeroline: false,
            },
            yaxis: {
                title: getAxisLabel(yAxis),
                titlefont: { size: 14 },
                showgrid: true,
                zeroline: false,
            },
            margin: { l: 80, r: 80, t: 80, b: 80 },
            autosize: true,
            hovermode: 'closest',
        };

        const config: Partial<Plotly.Config> = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'rupture_envelope_2d',
                height: 1000,
                width: 1200,
                scale: 2,
            },
        };

        Plotly.newPlot(plotRef.current, plotData, layout, config);

        return () => {
            if (plotRef.current) {
                Plotly.purge(plotRef.current);
            }
        };
    }, [data, xAxis, yAxis]);

    return (
        <div className="plot2d-container">
            <div ref={plotRef} className="plot2d" />
            <div className="plot-info">
                <p>
                    <strong>2D Rupture Envelope:</strong> Darker colors indicate higher rupture potential.
                    Hover over the plot to see detailed values.
                </p>
            </div>
        </div>
    );
};

function getAxisLabel(axis: AxisConfig): string {
    const labels: Record<string, string> = {
        R: 'Stress Ratio (R)',
        theta: 'Orientation θ (°)',
        friction: 'Friction Coefficient (μ)',
        cohesion: 'Cohesion (MPa)',
        lambda: 'Lambda (λ)',
        pressure: 'Pore Pressure (MPa)',
        poisson: "Poisson's Ratio (ν)",
    };
    return labels[axis.parameter] || axis.parameter;
}

export default Plot2D;