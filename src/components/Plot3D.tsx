import React, { useEffect, useRef } from 'react';
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

import { AxisConfig } from '../App';
import type { Cube } from '../RuptureEnvelop';
import './Plot3D.css';

interface Props {
    data: Cube;
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    zAxis: AxisConfig;
}

const Plot3D: React.FC<Props> = ({ data, xAxis, yAxis, zAxis }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const renderWindowRef = useRef<any>(null);

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

        // Calculate spacing based on axis ranges
        // const spacingX = (xAxis.max - xAxis.min) / (data.dimX - 1);
        // const spacingY = (yAxis.max - yAxis.min) / (data.dimY - 1);
        // const spacingZ = (zAxis.max - zAxis.min) / (data.dimZ - 1);
        const spacingX = 1
        const spacingY = 1
        const spacingZ = 1
        imageData.setSpacing(spacingX, spacingY, spacingZ);

        imageData.setOrigin(xAxis.min, yAxis.min, zAxis.min);

        // Create scalar array from data
        const scalars = vtkDataArray.newInstance({
            name: 'RuptureEnergy',
            values: new Float32Array(data.domain),
            numberOfComponents: 1,
        });

        imageData.getPointData().setScalars(scalars);

        // Create volume mapper
        const mapper = vtkVolumeMapper.newInstance();
        mapper.setInputData(imageData);
        mapper.setSampleDistance(0.5);

        // Get data range
        const dataRange = scalars.getRange();
        const minVal = dataRange[0];
        const maxVal = dataRange[1];

        // Create color transfer function
        const ctfun = vtkColorTransferFunction.newInstance();
        ctfun.addRGBPoint(minVal, 0.0, 0.0, 0.5); // Dark blue for low values
        ctfun.addRGBPoint(minVal + (maxVal - minVal) * 0.3, 0.2, 0.3, 0.8);
        ctfun.addRGBPoint(minVal + (maxVal - minVal) * 0.5, 0.4, 0.5, 1.0);
        ctfun.addRGBPoint(minVal + (maxVal - minVal) * 0.7, 0.7, 0.7, 1.0);
        ctfun.addRGBPoint(maxVal, 0.9, 0.9, 0.9); // Light gray for high values

        // Create opacity transfer function
        const ofun = vtkPiecewiseFunction.newInstance();
        ofun.addPoint(minVal, 0.0);
        ofun.addPoint(minVal + (maxVal - minVal) * 0.2, 0.1);
        ofun.addPoint(minVal + (maxVal - minVal) * 0.5, 0.3);
        ofun.addPoint(minVal + (maxVal - minVal) * 0.8, 0.7);
        ofun.addPoint(maxVal, 1.0);

        // Create volume
        const volume = vtkVolume.newInstance();
        volume.setMapper(mapper);
        volume.getProperty().setRGBTransferFunction(0, ctfun);
        volume.getProperty().setScalarOpacity(0, ofun);
        volume.getProperty().setInterpolationTypeToLinear();
        volume.getProperty().setShade(true);
        volume.getProperty().setAmbient(0.3);
        volume.getProperty().setDiffuse(0.6);
        volume.getProperty().setSpecular(0.4);
        volume.getProperty().setSpecularPower(20);

        // Add volume to renderer
        renderer.addVolume(volume);
        renderer.resetCamera();

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

        // Set background
        renderer.setBackground(0.95, 0.95, 0.97);

        // Initial render
        renderWindow.render();

        // Cleanup
        return () => {
            if (renderWindowRef.current) {
                renderWindowRef.current.delete();
                renderWindowRef.current = null;
            }
        };
    }, [data, xAxis, yAxis, zAxis]);

    return (
        <div className="plot3d-container">
            <div ref={containerRef} className="plot3d" />
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