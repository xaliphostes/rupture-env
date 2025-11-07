import React, { useState, useRef } from 'react';
import { RuptureEnvelope } from '../envelope/RuptureEnvelope';
import { AsyncRuptureEnvelope } from '../envelope/AsyncRuptureEnvelope';
import ParameterPanel from './ParameterPanel';
import AxisConfiguration from './AxisConfiguration';
import FaultUpload from './FaultUpload';
import Plot2D from './Plot2D';
import Plot3D from './Plot3D';
import ComputationModal from './ComputationModal';
import './App.css';
import { ProgressWithCallback } from '../envelope/ProgressWithCallback';

export type AxisType = 'R' | 'theta' | 'friction' | 'cohesion' | 'lambda' | 'pressure' | 'poisson';

export interface AxisConfig {
    parameter: AxisType;
    min: number;
    max: number;
    reverse: boolean;
}

export interface Parameters {
    friction: number;
    cohesion: number;
    lambda: number;
    pressure: number;
    poisson: number;
    SH: string;
    Sh: string;
    Sv: string;
    theta: number;
}

function App() {
    const [envelope] = useState(() => new RuptureEnvelope());
    const [mode, setMode] = useState<'2D' | '3D'>('2D');
    const [sampling, setSampling] = useState(10);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);
    
    // Modal-specific state
    const [showModal, setShowModal] = useState(false);
    const [computationProgress, setComputationProgress] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    
    // Ref to store the progress object for cancellation
    const progressRef = useRef<ProgressWithCallback | null>(null);

    const [parameters, setParameters] = useState<Parameters>({
        friction: 0.6,
        cohesion: 0,
        lambda: 0,
        pressure: 0,
        poisson: 0.25,
        SH: '0',
        Sh: '0',
        Sv: '1',
        theta: 0,
    });

    const [xAxis, setXAxis] = useState<AxisConfig>({
        parameter: 'friction',
        min: 0,
        max: 1,
        reverse: false,
    });

    const [yAxis, setYAxis] = useState<AxisConfig>({
        parameter: 'cohesion',
        min: 0,
        max: 1,
        reverse: false,
    });

    const [zAxis, setZAxis] = useState<AxisConfig>({
        parameter: 'theta',
        min: 0,
        max: 180,
        reverse: false,
    });

    const [faultUploaded, setFaultUploaded] = useState(false);

    const handleStop = () => {
        if (progressRef.current) {
            progressRef.current.cancel();
            console.log('Stop requested by user');
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setResults(null);
        setShowModal(true);
        setComputationProgress(0);

        try {
            // Apply parameters to envelope
            envelope.friction = parameters.friction;
            envelope.cohesion = parameters.cohesion;
            envelope.lambda = parameters.lambda;
            envelope.pressure = parameters.pressure;
            envelope.poisson = parameters.poisson;
            envelope.SH = parameters.SH;
            envelope.Sh = parameters.Sh;
            envelope.Sv = parameters.Sv;
            envelope.theta = parameters.theta;

            // Configure axes
            envelope.setAxis('x', xAxis.parameter, xAxis.min, xAxis.max, xAxis.reverse);
            envelope.setAxis('y', yAxis.parameter, yAxis.min, yAxis.max, yAxis.reverse);

            if (mode === '3D') {
                envelope.setAxis('z', zAxis.parameter, zAxis.min, zAxis.max, zAxis.reverse);
            }

            // Set sampling
            envelope.setSampling(sampling);

            // Calculate total steps
            const steps = mode === '2D' ? Math.pow(sampling, 2) : Math.pow(sampling, 3);
            setTotalSteps(steps);

            // Create progress tracker with callback
            const progress = new ProgressWithCallback(
                steps,
                'Computing',
                (current: number) => {
                    setComputationProgress(current);
                },
                5 // Report every 5%
            );
            
            // Store progress ref for cancellation
            progressRef.current = progress;

            // Create async wrapper
            const asyncEnvelope = new AsyncRuptureEnvelope(envelope);

            // Run computation asynchronously - this allows UI updates!
            if (mode === '2D') {
                await asyncEnvelope.run2DAsync(progress);
                if (!progress.isCancelled()) {
                    setResults(envelope.square());
                }
            } else {
                await asyncEnvelope.run3DAsync(progress);
                if (!progress.isCancelled()) {
                    setResults(envelope.cube());
                }
            }
        } catch (error: any) {
            if (error.message === 'Computation cancelled') {
                console.log('Computation was cancelled');
            } else {
                console.error('Error running envelope:', error);
                alert('Error running computation: ' + (error as Error).message);
            }
        } finally {
            setIsRunning(false);
            setShowModal(false);
            progressRef.current = null;
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Rupture Envelope Analysis</h1>
                <p>Fault system stability and rupture potential visualization</p>
            </header>

            <div className="app-container">
                <aside className="sidebar">
                    <div className="control-section">
                        <h2>Mode Selection</h2>
                        <div className="mode-selector">
                            <button
                                className={mode === '2D' ? 'active' : ''}
                                onClick={() => setMode('2D')}
                                disabled={isRunning}
                            >
                                2D Analysis
                            </button>
                            <button
                                className={mode === '3D' ? 'active' : ''}
                                onClick={() => setMode('3D')}
                                disabled={isRunning}
                            >
                                3D Analysis
                            </button>
                        </div>
                    </div>

                    <div className="control-section">
                        <h2>Sampling</h2>
                        <div className="sampling-control">
                            <label>
                                Grid Resolution: {sampling}
                                <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    value={sampling}
                                    onChange={(e) => setSampling(Number(e.target.value))}
                                    disabled={isRunning}
                                />
                            </label>
                        </div>
                    </div>

                    <FaultUpload
                        envelope={envelope}
                        onUploadComplete={() => setFaultUploaded(true)}
                    />

                    <AxisConfiguration
                        mode={mode}
                        xAxis={xAxis}
                        yAxis={yAxis}
                        zAxis={zAxis}
                        onXAxisChange={setXAxis}
                        onYAxisChange={setYAxis}
                        onZAxisChange={setZAxis}
                        disabled={isRunning}
                    />

                    <ParameterPanel
                        parameters={parameters}
                        onChange={setParameters}
                        disabled={isRunning}
                    />

                    <div className="control-section">
                        <button
                            className="run-button"
                            onClick={handleRun}
                            disabled={isRunning || !faultUploaded}
                        >
                            {isRunning ? 'Running...' : `Run ${mode} Analysis`}
                        </button>
                        {!faultUploaded && (
                            <p className="warning">Please upload a fault system first</p>
                        )}
                    </div>
                </aside>

                <main className="main-content">
                    {results ? (
                        <>
                            <div className="visualization-container">
                                {mode === '2D' ? (
                                    <Plot2D
                                        data={results}
                                        xAxis={xAxis}
                                        yAxis={yAxis}
                                    />
                                ) : (
                                    <Plot3D
                                        data={results}
                                        xAxis={xAxis}
                                        yAxis={yAxis}
                                        zAxis={zAxis}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="placeholder">
                            <div className="placeholder-content">
                                <h2>No Results Yet</h2>
                                <p>Configure parameters and run the analysis to see results</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Computation Modal */}
            <ComputationModal
                isOpen={showModal}
                mode={mode}
                progress={computationProgress}
                totalSteps={totalSteps}
                onStop={handleStop}
            />
        </div>
    );
}

export default App;