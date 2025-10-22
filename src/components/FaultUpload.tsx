import React, { useState, useRef } from 'react';
import { RuptureEnvelope } from '../RuptureEnvelop';
import { createEmptySerie } from '@youwol/dataframe';
import './FaultUpload.css';

interface Props {
    envelope: RuptureEnvelope;
    onUploadComplete: () => void;
}

const FaultUpload: React.FC<Props> = ({ envelope, onUploadComplete }) => {
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseOBJ = (content: string): { positions: number[]; indices: number[] } => {
        const lines = content.split('\n');
        const positions: number[] = [];
        const indices: number[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('v ')) {
                // Vertex line
                const parts = trimmed.split(/\s+/);
                positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            } else if (trimmed.startsWith('f ')) {
                // Face line (assuming triangles)
                const parts = trimmed.split(/\s+/);
                for (let i = 1; i <= 3; i++) {
                    // Handle formats like "v/vt/vn" or just "v"
                    const vertexIndex = parseInt(parts[i].split('/')[0]) - 1; // OBJ is 1-indexed
                    indices.push(vertexIndex);
                }
            }
        }

        return { positions, indices };
    };

    const parseSTL = (content: string): { positions: number[]; indices: number[] } => {
        const lines = content.split('\n');
        const positions: number[] = [];
        const indices: number[] = [];
        let vertexCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('vertex ')) {
                const parts = line.split(/\s+/);
                positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                indices.push(vertexCount++);
            }
        }

        return { positions, indices };
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        envelope.reset();

        const newFiles: string[] = [];

        try {
            for (const file of Array.from(files)) {
                const content = await file.text();
                const extension = file.name.split('.').pop()?.toLowerCase();

                let parsedData: { positions: number[]; indices: number[] };

                if (extension === 'obj') {
                    parsedData = parseOBJ(content);
                } else if (extension === 'stl') {
                    parsedData = parseSTL(content);
                } else {
                    console.warn(`Unsupported file type: ${extension}`);
                    continue;
                }

                // Create series
                const positions = createEmptySerie({
                    Type: Float32Array,
                    count: parsedData.positions.length / 3,
                    itemSize: 3,
                    shared: false,
                });
                positions.array.set(parsedData.positions);

                const indices = createEmptySerie({
                    Type: Uint32Array,
                    count: parsedData.indices.length / 3,
                    itemSize: 3,
                    shared: false,
                });
                indices.array.set(parsedData.indices);

                // Add to envelope
                envelope.addFault(positions, indices);
                newFiles.push(file.name);
            }

            setUploadedFiles((prev) => [...prev, ...newFiles]);
            onUploadComplete();
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files: ' + (error as Error).message);
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClear = () => {
        envelope.reset();
        setUploadedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fault-upload">
            <h2>Fault System</h2>

            <div className="upload-area">
                <label htmlFor="fault-file-input" className="upload-button">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {isProcessing ? 'Processing...' : 'Upload Fault Geometry'}
                </label>
                <input
                    ref={fileInputRef}
                    id="fault-file-input"
                    type="file"
                    accept=".obj,.stl"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    style={{ display: 'none' }}
                />
                <p className="upload-hint">Supported formats: OBJ, STL</p>
            </div>

            {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                    <div className="files-header">
                        <h3>Loaded Faults ({uploadedFiles.length})</h3>
                        <button className="clear-button" onClick={handleClear} disabled={isProcessing}>
                            Clear All
                        </button>
                    </div>
                    <ul className="file-list">
                        {uploadedFiles.map((file, index) => (
                            <li key={index} className="file-item">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {file}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="upload-info">
                <p>
                    <strong>Note:</strong> Upload one or more triangulated surface files representing your fault system.
                    The geometry will be used to compute stress interactions and rupture potential.
                </p>
            </div>
        </div>
    );
};

export default FaultUpload;