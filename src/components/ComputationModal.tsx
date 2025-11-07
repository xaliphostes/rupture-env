import React from 'react';
import './ComputationModal.css';

interface Props {
    isOpen: boolean;
    mode: '2D' | '3D';
    progress: number;
    totalSteps: number;
    onStop: () => void;
}

const ComputationModal: React.FC<Props> = ({ isOpen, mode, progress, totalSteps, onStop }) => {
    if (!isOpen) return null;

    const percentage = totalSteps > 0 ? Math.round((progress / totalSteps) * 100) : 0;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Running {mode} Analysis</h2>
                </div>

                <div className="modal-body">
                    <div className="spinner"></div>

                    <p className="progress-text">
                        Computing rupture envelope...
                    </p>

                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>

                    <p className="progress-stats">
                        {progress} / {totalSteps} ({percentage}%)
                    </p>

                    <p className="progress-hint">
                        This may take a few moments depending on the grid resolution...
                    </p>

                    <button className="stop-button" onClick={onStop}>
                        Stop Computation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComputationModal;