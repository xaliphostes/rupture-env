import React, { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor';

import vtkCubeAxesActor from '@kitware/vtk.js/Rendering/Core/CubeAxesActor';
import * as d3scale from 'd3-scale';
import * as d3array from 'd3-array';

import { AxisConfig } from './App';
import type { Cube } from '../envelope/RuptureEnvelope';
import './Plot3D.css';

interface Props {
    data: Cube;
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    zAxis: AxisConfig;
}

interface RenderingParams {
    sampleDistance: number;
    ambient: number;
    diffuse: number;
    specular: number;
    specularPower: number;
    opacityScale: number;
    colorShift: number;
}

const Plot3D: React.FC<Props> = ({ data, xAxis, yAxis, zAxis }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const renderWindowRef = useRef<any>(null);
    const volumeRef = useRef<any>(null);
    const mapperRef = useRef<any>(null);
    const ctfunRef = useRef<any>(null);
    const ofunRef = useRef<any>(null);
    const dataRangeRef = useRef<[number, number]>([0, 1]);

    const [showControls, setShowControls] = useState(true);
    const [params, setParams] = useState<RenderingParams>({
        sampleDistance: 0.4,
        ambient: 0.2,
        diffuse: 0.7,
        specular: 0.5,
        specularPower: 40,
        opacityScale: 1.0,
        colorShift: 0.5,
    });

    useEffect(() => {
        if (!containerRef.current || !data) return;

        // Create full screen render window
        const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            rootContainer: containerRef.current,
            containerStyle: {
                height: '100%',
                width: '100%',
                position: 'absolute',
            },
        });

        const renderer = fullScreenRenderer.getRenderer();
        const renderWindow = fullScreenRenderer.getRenderWindow();
        renderWindowRef.current = fullScreenRenderer;

        // Create image data
        const imageData = vtkImageData.newInstance();
        imageData.setDimensions(data.dimX, data.dimY, data.dimZ);

        const spacingX = 1;
        const spacingY = 1;
        const spacingZ = 1;
        imageData.setSpacing(spacingX, spacingY, spacingZ);
        imageData.setOrigin(xAxis.min, yAxis.min, zAxis.min);

        // Create scalar array from data
        const scalars = vtkDataArray.newInstance({
            name: 'RuptureEnergy',
            values: new Float32Array(data.domain),
            numberOfComponents: 1,
        });

        imageData.getPointData().setScalars(scalars);

        // Create volume mapper with enhanced settings
        const mapper = vtkVolumeMapper.newInstance();
        mapper.setInputData(imageData);
        mapper.setSampleDistance(params.sampleDistance);
        mapperRef.current = mapper;

        // Get data range
        const dataRange = scalars.getRange();
        const minVal = dataRange[0];
        const maxVal = dataRange[1];
        dataRangeRef.current = [minVal, maxVal];

        // Create color transfer function
        const ctfun = vtkColorTransferFunction.newInstance();
        updateColorTransferFunction(ctfun, minVal, maxVal, params.colorShift);
        ctfunRef.current = ctfun;

        // Create opacity transfer function
        const ofun = vtkPiecewiseFunction.newInstance();
        updateOpacityFunction(ofun, minVal, maxVal, params.opacityScale);
        ofunRef.current = ofun;

        // Create volume with enhanced properties
        const volume = vtkVolume.newInstance();
        volume.setMapper(mapper);
        volume.getProperty().setRGBTransferFunction(0, ctfun);
        volume.getProperty().setScalarOpacity(0, ofun);
        volume.getProperty().setInterpolationTypeToLinear();

        // Enhanced lighting and shading
        volume.getProperty().setShade(true);
        volume.getProperty().setAmbient(params.ambient);
        volume.getProperty().setDiffuse(params.diffuse);
        volume.getProperty().setSpecular(params.specular);
        volume.getProperty().setSpecularPower(params.specularPower);

        volumeRef.current = volume;

        // Add volume to renderer
        renderer.addVolume(volume);

        // Add 3D axes with graduations
        const cubeAxes = vtkCubeAxesActor.newInstance();
        cubeAxes.setCamera(renderer.getActiveCamera());
        cubeAxes.setDataBounds(volume.getBounds());
        console.log(volume.getBounds())

        // Replace ticks from axis 0
        function myGenerateTicks(dataBounds: [number, number]) {
            const res = vtkCubeAxesActor.defaultGenerateTicks(dataBounds);
            const scale = d3scale.scaleLinear().domain([dataBounds[0], dataBounds[1]]);
            res.ticks[0] = d3array.range(dataBounds[0], dataBounds[1], 0.1);
            const format = scale.tickFormat(res.ticks[0].length);
            res.tickStrings[0] = res.ticks[0].map(format);
            return res;
        }
        cubeAxes.setGenerateTicks(myGenerateTicks);
        renderer.addActor(cubeAxes);

        /*
        // Add orientation marker
        const axes = vtkAnnotatedCubeActor.newInstance();
        axes.setDefaultStyle({
            text: '+X',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            fontColor: 'white',
            fontSizeScale: (res: number) => res / 2,
            faceColor: '#667eea',
            faceRotation: 0,
            edgeThickness: 0.1,
            edgeColor: 'white',
            resolution: 400,
        });

        // Customize faces
        axes.setXPlusFaceProperty({ text: getAxisLabel(xAxis, '+') });
        axes.setXMinusFaceProperty({ text: getAxisLabel(xAxis, '-') });
        axes.setYPlusFaceProperty({ text: getAxisLabel(yAxis, '+') });
        axes.setYMinusFaceProperty({ text: getAxisLabel(yAxis, '-') });
        axes.setZPlusFaceProperty({ text: getAxisLabel(zAxis, '+') });
        axes.setZMinusFaceProperty({ text: getAxisLabel(zAxis, '-') });

        const orientationWidget = vtkOrientationMarkerWidget.newInstance({
            actor: axes,
            interactor: renderWindow.getInteractor(),
        });
        orientationWidget.setEnabled(true);
        orientationWidget.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
        );
        orientationWidget.setViewportSize(0.15);
        orientationWidget.setMinPixelSize(100);
        orientationWidget.setMaxPixelSize(300);
        */

        // Set background
        renderer.setBackground(0.95, 0.95, 0.97);

        // Initial render
        renderer.resetCamera();
        renderWindow.render();

        // Cleanup
        return () => {
            if (renderWindowRef.current) {
                renderWindowRef.current.delete();
                renderWindowRef.current = null;
            }
        };
    }, [data, xAxis, yAxis, zAxis]);

    // Update rendering when parameters change
    useEffect(() => {
        if (!volumeRef.current || !mapperRef.current) return;

        const volume = volumeRef.current;
        const mapper = mapperRef.current;
        const [minVal, maxVal] = dataRangeRef.current;

        // Update mapper
        mapper.setSampleDistance(params.sampleDistance);

        // Update lighting
        volume.getProperty().setAmbient(params.ambient);
        volume.getProperty().setDiffuse(params.diffuse);
        volume.getProperty().setSpecular(params.specular);
        volume.getProperty().setSpecularPower(params.specularPower);

        // Update transfer functions
        if (ctfunRef.current) {
            updateColorTransferFunction(ctfunRef.current, minVal, maxVal, params.colorShift);
        }
        if (ofunRef.current) {
            updateOpacityFunction(ofunRef.current, minVal, maxVal, params.opacityScale);
        }

        // Re-render
        if (renderWindowRef.current) {
            renderWindowRef.current.getRenderWindow().render();
        }
    }, [params]);

    const handleParamChange = (key: keyof RenderingParams, value: number) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="plot3d-container">
            <div ref={containerRef} className="plot3d" />

            {/* Floating controls toggle button */}
            <button
                className="controls-toggle"
                onClick={() => setShowControls(!showControls)}
                title={showControls ? "Hide controls" : "Show controls"}
            >
                {showControls ? '✕' : '⚙'}
            </button>

            {/* Floating controls panel */}
            {showControls && (
                <div className="floating-controls">
                    <h3>Rendering Controls</h3>

                    <div className="control-section">
                        <h4>Transfer Functions</h4>

                        <div className="control-group">
                            <label>
                                Opacity Scale
                                <span className="value">{params.opacityScale.toFixed(2)}</span>
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="2.0"
                                step="0.1"
                                value={params.opacityScale}
                                onChange={(e) => handleParamChange('opacityScale', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="control-group">
                            <label>
                                Color Shift
                                <span className="value">{params.colorShift.toFixed(2)}</span>
                            </label>
                            <input
                                type="range"
                                min="0.0"
                                max="1.0"
                                step="0.05"
                                value={params.colorShift}
                                onChange={(e) => handleParamChange('colorShift', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="control-section">
                        <h4>Lighting</h4>

                        <div className="control-group">
                            <label>
                                Ambient
                                <span className="value">{params.ambient.toFixed(2)}</span>
                            </label>
                            <input
                                type="range"
                                min="0.0"
                                max="1.0"
                                step="0.05"
                                value={params.ambient}
                                onChange={(e) => handleParamChange('ambient', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="control-group">
                            <label>
                                Diffuse
                                <span className="value">{params.diffuse.toFixed(2)}</span>
                            </label>
                            <input
                                type="range"
                                min="0.0"
                                max="1.0"
                                step="0.05"
                                value={params.diffuse}
                                onChange={(e) => handleParamChange('diffuse', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="control-group">
                            <label>
                                Specular
                                <span className="value">{params.specular.toFixed(2)}</span>
                            </label>
                            <input
                                type="range"
                                min="0.0"
                                max="1.0"
                                step="0.05"
                                value={params.specular}
                                onChange={(e) => handleParamChange('specular', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="control-group">
                            <label>
                                Specular Power
                                <span className="value">{params.specularPower.toFixed(0)}</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={params.specularPower}
                                onChange={(e) => handleParamChange('specularPower', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="control-section">
                        <h4>Quality</h4>

                        <div className="control-group">
                            <label>
                                Sample Distance
                                <span className="value">{params.sampleDistance.toFixed(2)}</span>
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={params.sampleDistance}
                                onChange={(e) => handleParamChange('sampleDistance', parseFloat(e.target.value))}
                            />
                            <small>Lower = higher quality (slower)</small>
                        </div>
                    </div>

                    <button
                        className="reset-button"
                        onClick={() => setParams({
                            sampleDistance: 0.4,
                            ambient: 0.2,
                            diffuse: 0.7,
                            specular: 0.5,
                            specularPower: 40,
                            opacityScale: 1.0,
                            colorShift: 0.5,
                        })}
                    >
                        Reset to Defaults
                    </button>
                </div>
            )}

            <div className="plot3d-controls">
                <div className="plot-info">
                    <p>
                        <strong>3D Rupture Envelope:</strong> Volume rendering showing rupture potential in 3D parameter space.
                        Use mouse to rotate (left), pan (shift+left), and zoom (scroll).
                    </p>
                </div>
                <div className="plot3d-legend">
                    <h4>Color Scale</h4>
                    <div className="legend-gradient">
                        <span>Low Energy</span>
                        <div className="gradient-bar"></div>
                        <span>High Energy</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

function updateColorTransferFunction(
    ctfun: any,
    minVal: number,
    maxVal: number,
    shift: number
) {
    ctfun.removeAllPoints();

    // Adjust color distribution based on shift parameter
    const mid = minVal + (maxVal - minVal) * shift;
    const range = maxVal - minVal;

    ctfun.addRGBPoint(minVal, 0.0, 0.0, 0.5); // Dark blue
    ctfun.addRGBPoint(minVal + range * 0.2 * shift, 0.2, 0.3, 0.8);
    ctfun.addRGBPoint(mid * 0.8, 0.3, 0.5, 1.0);
    ctfun.addRGBPoint(mid, 0.5, 0.7, 1.0);
    ctfun.addRGBPoint(mid + (maxVal - mid) * 0.5, 0.7, 0.8, 1.0);
    ctfun.addRGBPoint(maxVal, 0.9, 0.9, 0.9); // Light gray
}

function updateOpacityFunction(
    ofun: any,
    minVal: number,
    maxVal: number,
    scale: number
) {
    ofun.removeAllPoints();

    const range = maxVal - minVal;

    ofun.addPoint(minVal, 0.0);
    ofun.addPoint(minVal + range * 0.15, 0.05 * scale);
    ofun.addPoint(minVal + range * 0.3, 0.2 * scale);
    ofun.addPoint(minVal + range * 0.5, 0.4 * scale);
    ofun.addPoint(minVal + range * 0.7, 0.6 * scale);
    ofun.addPoint(minVal + range * 0.85, 0.8 * scale);
    ofun.addPoint(maxVal, 1.0 * scale);
}

function getAxisLabel(axis: AxisConfig, direction: '+' | '-'): string {
    const labels: Record<string, string> = {
        R: 'R',
        theta: 'θ',
        friction: 'μ',
        cohesion: 'C',
        lambda: 'λ',
        pressure: 'P',
        poisson: 'ν',
    };
    const label = labels[axis.parameter] || axis.parameter;
    return `${direction}${label}`;
}

export default Plot3D;