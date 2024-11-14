import { useState, useRef, useMemo } from 'react';
import { PatternType, BasePatternConfig, Point } from '../patterns/types';
import { getPatternGenerator, createPatternConfig } from '../patterns/pattern-factory';
import { generateCenterPoints } from '../centerFill/index';
import { FormattedValue } from './FormattedValue';
import { SliderControl } from './SliderControl';
import { MM_TO_PX, Units, ScaleType } from '../constants';

// Initial values in millimeters
const DEFAULT_VALUES_MM = {
  radius: 200,         // 200mm
  holeRadius: 6,       // 2mm
  spacing: 6,          // 5mm
  minClearance: 1,     // 1mm
  centerExclusion: 0,  // 0mm
};

// Convert to pixels for internal storage
const DEFAULT_VALUES_PX = {
  radius: DEFAULT_VALUES_MM.radius * MM_TO_PX,
  holeRadius: DEFAULT_VALUES_MM.holeRadius * MM_TO_PX,
  spacing: DEFAULT_VALUES_MM.spacing * MM_TO_PX,
  minClearance: DEFAULT_VALUES_MM.minClearance * MM_TO_PX,
  centerExclusion: DEFAULT_VALUES_MM.centerExclusion * MM_TO_PX,
};

const SpeakerGrille = () => {
  // All internal values are stored in pixels
  const [radius, setRadius] = useState(DEFAULT_VALUES_PX.radius);
  const [holeRadius, setHoleRadius] = useState(DEFAULT_VALUES_PX.holeRadius);
  const [divergenceAngle, setDivergenceAngle] = useState(137.5);
  const [spacingFactor, setSpacingFactor] = useState(0);
  const [spacingScaling, setSpacingScaling] = useState(0);
  const [forceStrength, setForceStrength] = useState(1.0);
  const [pattern, setPattern] = useState<PatternType>('phyllotaxis');
  const [minClearance, setMinClearance] = useState(DEFAULT_VALUES_PX.minClearance);
  const [centerExclusion, setCenterExclusion] = useState(DEFAULT_VALUES_PX.centerExclusion);
  const [centerDensity, setCenterDensity] = useState(0);
  const [ringSpacingFactor, setRingSpacingFactor] = useState(0);
  const [pointSpacingFactor, setPointSpacingFactor] = useState(0);
  const [sizeScaling, setSizeScaling] = useState(0);
  const [scaleType, setScaleType] = useState<ScaleType>('linear');
  const [useStrokes, setUseStrokes] = useState(false);
  const [units, setUnits] = useState<Units>('mm');
  const [invertColours, setInvertColours] = useState(false);
  const [selectedColour, setSelectedColour] = useState('#000000');
  const [includeAlignmentMarks, setIncludeAlignmentMarks] = useState(false);
  const [allowPartialHoles, setAllowPartialHoles] = useState(false);
  const [centerHole, setCenterHole] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);

  const getCircleSize = (x: number, y: number, baseSize: number) => {
    if (sizeScaling === 0) return baseSize;
    const distance = Math.sqrt(x * x + y * y) / radius;
    return baseSize * (scaleType === 'linear' 
      ? 1 + sizeScaling * (1 - 2 * distance)
      : Math.exp(sizeScaling * (1 - 2 * distance)));
  };

  const getSpacing = (x: number, y: number, baseSpacing: number) => {
    if (spacingScaling === 0) return baseSpacing;
    
    // Calculate distance from center (0 to 1)
    const distance = Math.sqrt(x * x + y * y) / radius;
    
    // For concentric pattern, use a more moderate scaling
    const amplifiedScaling = spacingScaling * (pattern === 'concentric' ? 1 : pattern === 'fermat' ? 4 : 2);
    
    // Ensure we properly return to baseSpacing at the edge
    const normalizedDistance = Math.min(distance, 1);
    
    if (scaleType === 'linear') {
      return baseSpacing * (1 + amplifiedScaling * (1 - normalizedDistance));
    } else {
      const scaleFactor = Math.exp(amplifiedScaling * (1 - normalizedDistance)) - 1;
      return baseSpacing * (1 + scaleFactor);
    }
  };

  // Generate all points in a single pass
  const points = useMemo(() => {
    // First generate base pattern
    const baseSpacing = holeRadius * (1.5 + spacingFactor);
    const maxSpacingMultiplier = spacingScaling > 0 
      ? (scaleType === 'linear' ? 1 + spacingScaling : Math.exp(spacingScaling))
      : 1;

    const numPoints = Math.round(
      (radius * radius) / (baseSpacing * baseSpacing) * 
      (maxSpacingMultiplier * maxSpacingMultiplier)
    );
    
    const baseConfig: BasePatternConfig = {
      radius,
      holeRadius,
      minClearance,
      centerHole,
      centerExclusion,
      getSpacing,
      spacingFactor
    };

    const config = createPatternConfig(
      pattern,
      baseConfig,
      divergenceAngle,
      baseSpacing,
      numPoints,
      pattern === 'concentric' ? {
        ringSpacingFactor,
        pointSpacingFactor
      } : undefined
    );


    // Generate initial pattern points
    const generator = getPatternGenerator(pattern);
    const patternPoints = generator.generatePoints(config);

    // If no center area to handle, just return pattern points
    if (centerExclusion <= 0) {
      return patternPoints;
    }

    // Let center fill algorithm handle the pattern
    return generateCenterPoints({
      centerRadius: centerExclusion,
      minDistance: minClearance,
      holeRadius: holeRadius,
      patternPoints: patternPoints,
      centerHole,
      densityFactor: centerDensity,
      forceStrength,
      maxIterations: 150
    });
  }, [
    pattern,
    radius,
    holeRadius,
    divergenceAngle,
    spacingFactor,
    spacingScaling,
    scaleType,
    minClearance,
    centerExclusion,
    centerHole,
    centerDensity,
    forceStrength,
    ringSpacingFactor,     // Add this
    pointSpacingFactor     // And this
  ]);

  // File operations
  const exportSVG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current.cloneNode(true) as SVGSVGElement;
    const svgData = svgElement.outerHTML;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'speaker-grille.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const randomize = () => {
    if (units === 'mm') {
      const randomMmHoleRadius = 2.5 + Math.random() * 9.5; // 0.5-10mm
      setHoleRadius(randomMmHoleRadius * MM_TO_PX);
    } else {
      setHoleRadius(2 + Math.random() * 38); // 2-40px
    }
    setSpacingFactor(Math.random() * 2 - 1);
    setSizeScaling(-1 + Math.random() * 2);
  };

  const resetDefaults = () => {
    setRadius(DEFAULT_VALUES_PX.radius);
    setHoleRadius(DEFAULT_VALUES_PX.holeRadius);
    setSpacingFactor(0);
    setMinClearance(DEFAULT_VALUES_PX.minClearance);
    setCenterExclusion(DEFAULT_VALUES_PX.centerExclusion);
    setRingSpacingFactor(0);
    setPointSpacingFactor(0);
    setDivergenceAngle(137.5);
    setSizeScaling(0);
    setSpacingScaling(0);
    setScaleType('linear');
    setUseStrokes(false);
    setCenterHole(false);
  };

  return (
    <div className="w-screen p-4">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* SVG Display */}
        <div className="max-w-3xl mx-auto w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <svg
            ref={svgRef}
            viewBox={`${-radius} ${-radius} ${2 * radius} ${2 * radius}`}
            className="w-[90%] h-[90%] rounded-full"
            style={{
              background: invertColours ? selectedColour : '#FFFFFF',
              fill: invertColours ? '#FFFFFF' : selectedColour,
              stroke: invertColours ? selectedColour : '#FFFFFF',
            }}
          >
            {invertColours && (
              <rect
                x={-radius}
                y={-radius}
                width={2 * radius}
                height={2 * radius}
                fill={selectedColour}
              />
            )}
            {points.map((point: Point, i: number) => {
              const distSq = point.x * point.x + point.y * point.y;
              const scaledHoleRadius = getCircleSize(point.x, point.y, holeRadius);
              const isOutsideRadius = distSq > (radius - scaledHoleRadius) * (radius - scaledHoleRadius);
              
              if (allowPartialHoles || !isOutsideRadius) {
                return (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={scaledHoleRadius}
                    fill={useStrokes ? 'none' : invertColours ? 'white' : selectedColour}
                    stroke={useStrokes ? (invertColours ? '#FFFFFF' : selectedColour) : 'none'}
                    strokeWidth={useStrokes ? 0.5 : 0}
                  />
                );
              }
              return null;
            })}
            {includeAlignmentMarks && (
              <>
                <circle
                  cx={0}
                  cy={0}
                  r={radius}
                  stroke={invertColours ? '#FFFFFF' : selectedColour}
                  fill="none"
                />
                <line
                  x1={-radius}
                  y1={0}
                  x2={radius}
                  y2={0}
                  stroke={invertColours ? '#FFFFFF' : selectedColour}
                />
                <line
                  x1={0}
                  y1={-radius}
                  x2={0}
                  y2={radius}
                  stroke={invertColours ? '#FFFFFF' : selectedColour}
                />
              </>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pattern Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Pattern Type</label>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value as PatternType)}
                className="w-full border rounded p-2"
              >
                <option value="phyllotaxis">Phyllotaxis</option>
                <option value="fermat">Fermat spiral</option>
                <option value="concentric">Concentric rings</option>
                <option value="hex">Hex</option>
              </select>
            </div>

            {!['concentric', 'hex'].includes(pattern) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Divergence angle (<FormattedValue value={divergenceAngle} units="°" precision={1} />)
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={0.5}
                  value={divergenceAngle}
                  onChange={(e) => setDivergenceAngle(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {pattern === 'concentric' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Ring Spacing (<FormattedValue value={ringSpacingFactor} precision={2} />)
                  </label>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={ringSpacingFactor}
                    onChange={(e) => setRingSpacingFactor(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Point Spacing (<FormattedValue value={pointSpacingFactor} precision={2} />)
                  </label>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={pointSpacingFactor}
                    onChange={(e) => setPointSpacingFactor(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>

          
          <div className="space-y-6">

            {/* Center Area Controls */}
            {!['concentric', 'hex'].includes(pattern) && (
              <div className="space-y-6">

                <SliderControl
                  label="Center Area Size"
                  value={centerExclusion}
                  onChange={setCenterExclusion}
                  units={units}
                  mmRange={[0, 200, 5]}
                  pxRange={[0, 800, 5]}
                  precision={1}
                />

                {centerExclusion > 0 && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Center Fill Density (<FormattedValue value={centerDensity} precision={2} />)
                      </label>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={centerDensity}
                        onChange={(e) => setCenterDensity(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>


                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Force Strength (<FormattedValue value={forceStrength} precision={2} />)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={2}  // Changed from 1 to 2
                        step={0.05}
                        value={forceStrength}
                        onChange={(e) => setForceStrength(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
    
                  </>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="center-hole"
                checked={centerHole}
                onChange={() => setCenterHole(!centerHole)}
                className="rounded-sm h-5 w-5 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="center-hole" className="text-sm font-medium">
                Include center hole
              </label>
            </div>

          </div>

          {/* General Controls */}
          <div className="space-y-6">
            <SliderControl
              label="Overall Radius"
              value={radius}
              onChange={setRadius}
              units={units}
              mmRange={[50, 500, 1]}
              pxRange={[200, 2000, 1]}
              precision={0}
            />

            <SliderControl
              label="Hole size"
              value={holeRadius}
              onChange={setHoleRadius}
              units={units}
              mmRange={[2, 50, 0.5]}
              pxRange={[2, 40, 0.5]}
              precision={1}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Hole size scaling (<FormattedValue value={sizeScaling} precision={2} />)
              </label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={sizeScaling}
                onChange={(e) => setSizeScaling(Number(e.target.value))}
                className="w-full"
              />
              <select
                value={scaleType}
                onChange={(e) => setScaleType(e.target.value as ScaleType)}
                className="w-full border rounded p-2 mt-2"
              >
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Spacing (<FormattedValue value={spacingFactor} precision={2} />)
              </label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={spacingFactor}
                onChange={(e) => setSpacingFactor(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Spacing scaling (<FormattedValue value={spacingScaling} precision={2} />)
              </label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={spacingScaling}
                onChange={(e) => setSpacingScaling(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex gap-2 justify-end">
          <button
            onClick={exportSVG}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save SVG
          </button>
          <button
            onClick={randomize}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Random
          </button>
          <button
            onClick={resetDefaults}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Reset
          </button>
        </div>

        {/* Visual Options */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="alignment-marks"
              checked={includeAlignmentMarks}
              onChange={() => setIncludeAlignmentMarks(!includeAlignmentMarks)}
              className="rounded-sm h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="alignment-marks" className="text-sm font-medium">
              Include alignment marks
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="strokes"
              checked={useStrokes}
              onChange={(e) => setUseStrokes(e.target.checked)}
              className="rounded-sm h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="strokes" className="text-sm font-medium">
              Use strokes
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="invert-colours"
              checked={invertColours}
              onChange={() => setInvertColours(!invertColours)}
              className="rounded-sm h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="invert-colours" className="text-sm font-medium">
              Invert colours
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="colour-picker" className="text-sm font-medium">
              Pick Colour:
            </label>
            <input
              type="color"
              id="colour-picker"
              value={selectedColour}
              onChange={(e) => setSelectedColour(e.target.value)}
              className="h-10 w-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium mr-4">Units:</label>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value as Units)}
              className="border rounded p-2"
            >
              <option value="mm">Millimeters</option>
              <option value="px">Pixels</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allow-partial-holes"
              checked={allowPartialHoles}
              onChange={() => setAllowPartialHoles(!allowPartialHoles)}
              className="rounded-sm h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allow-partial-holes" className="text-sm font-medium">
              Allow partial holes
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerGrille;
