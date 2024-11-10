import { useState, useRef, useMemo } from 'react';
import { generatePatternPoints, PatternType } from './generatePatternPoints';
import { generateCenterPoints, CenterFillAlgorithm } from './centerFillAlgorithms';
import { FormattedValue } from './FormattedValue';
import { SliderControl } from './SliderControl';
import { MM_TO_PX, PX_TO_MM, Units, ScaleType } from './constants';

// Initial values in millimeters
const DEFAULT_VALUES_MM = {
  radius: 200,         // 200mm
  holeRadius: 2,       // 2mm
  spacing: 5,          // 5mm
  minClearance: 1,     // 1mm
  centerExclusion: 0,  // 0mm
  concentricSpacing: 8 // 8mm
};

// Convert to pixels for internal storage
const DEFAULT_VALUES_PX = {
  radius: DEFAULT_VALUES_MM.radius * MM_TO_PX,
  holeRadius: DEFAULT_VALUES_MM.holeRadius * MM_TO_PX,
  spacing: DEFAULT_VALUES_MM.spacing * MM_TO_PX,
  minClearance: DEFAULT_VALUES_MM.minClearance * MM_TO_PX,
  centerExclusion: DEFAULT_VALUES_MM.centerExclusion * MM_TO_PX,
  concentricSpacing: DEFAULT_VALUES_MM.concentricSpacing * MM_TO_PX
};

const SpeakerGrille = () => {
  // All internal values are stored in pixels
  const [radius, setRadius] = useState(500);
  const [holeRadius, setHoleRadius] = useState(5);
  const [divergenceAngle, setDivergenceAngle] = useState(137.5);
  const [numPoints, setNumPoints] = useState(2000);
  const [spacing, setSpacing] = useState(12);
  const [pattern, setPattern] = useState<PatternType>('phyllotaxis');
  const [minClearance, setMinClearance] = useState(2);
  const [centerExclusion, setCenterExclusion] = useState(0);
  const [concentricSpacing, setConcentricSpacing] = useState(20);
  const [sizeScaling, setSizeScaling] = useState(0);
  const [scaleType, setScaleType] = useState<ScaleType>('linear');
  const [useStrokes, setUseStrokes] = useState(false);
  const [units, setUnits] = useState<Units>('mm');
  const [centerAlgorithm, setCenterAlgorithm] = useState<CenterFillAlgorithm>('force');
  const [invertColours, setInvertColours] = useState(false)
  const [selectedColour, setSelectedColour] = useState('#000000')
  const [includeAlignmentMarks, setIncludeAlignmentMarks] = useState(false)
  
  const svgRef = useRef<SVGSVGElement>(null);

  const getCircleSize = (x: number, y: number, baseSize: number) => {
    if (sizeScaling === 0) return baseSize;
    const distance = Math.sqrt(x * x + y * y) / radius;
    return baseSize * (scaleType === 'linear' 
      ? 1 + sizeScaling * (1 - 2 * distance)
      : Math.exp(sizeScaling * (1 - 2 * distance)));
  };

  const patternPoints = useMemo(() => generatePatternPoints({
    pattern,
    radius,
    holeRadius,
    divergenceAngle,
    spacing,
    minClearance,
    numPoints,
    concentricSpacing,
    centerExclusion
  }), [pattern, radius, holeRadius, divergenceAngle, spacing, minClearance, numPoints, concentricSpacing, centerExclusion]);

  const centerPoints = useMemo(() => {
    if (centerExclusion === 0) return [];
    return generateCenterPoints({
      algorithm: centerAlgorithm,
      centerRadius: centerExclusion,
      minDistance: minClearance + holeRadius * 2,
      bufferRadius: centerExclusion + (2 * holeRadius + minClearance),
      outerPoints: patternPoints.filter(p => {
        const distSq = p.x * p.x + p.y * p.y;
        const bufferRadius = centerExclusion + (2 * holeRadius + minClearance);
        return distSq >= centerExclusion * centerExclusion && distSq <= bufferRadius * bufferRadius;
      }),
      spacing
    });
  }, [centerAlgorithm, centerExclusion, holeRadius, minClearance, patternPoints, spacing]);

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

  // Randomize function using proper ranges
  const randomize = () => {
    setDivergenceAngle(Math.random() * 360);
    
    if (units === 'mm') {
      // Generate random values in mm and convert to px
      const randomMmSpacing = 1 + Math.random() * 29; // 1-30mm
      const randomMmHoleRadius = 0.5 + Math.random() * 9.5; // 0.5-10mm
      
      setSpacing(randomMmSpacing * MM_TO_PX);
      setHoleRadius(randomMmHoleRadius * MM_TO_PX);
    } else {
      setSpacing(4 + Math.random() * 116); // 4-120px
      setHoleRadius(2 + Math.random() * 38); // 2-40px
    }
    
    setSizeScaling(-1 + Math.random() * 2);
  };

  // Reset function using proper pixel values
  const resetDefaults = () => {
    setRadius(DEFAULT_VALUES_PX.radius);
    setHoleRadius(DEFAULT_VALUES_PX.holeRadius);
    setSpacing(DEFAULT_VALUES_PX.spacing);
    setMinClearance(DEFAULT_VALUES_PX.minClearance);
    setCenterExclusion(DEFAULT_VALUES_PX.centerExclusion);
    setConcentricSpacing(DEFAULT_VALUES_PX.concentricSpacing);
    setDivergenceAngle(137.5);
    setNumPoints(2000);
    setSizeScaling(0);
    setScaleType('linear');
    setUseStrokes(false);
  };

  return (
    <div className="w-screen p-4">
      <div className="flex flex-col gap-6">
        {/* SVG Display */}
        <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <svg 
            ref={svgRef}
            viewBox={`${-radius} ${-radius} ${2*radius} ${2*radius}`}
            className={`w-[90%] h-[90%] rounded-full`}
            style={{
              background: invertColours ? selectedColour : '#FFFFFF',
              fill: invertColours ? '#FFFFFF' : selectedColour,
              stroke: invertColours ? selectedColour : '#FFFFFF',
            }}
            background={invertColours ? selectedColour : '#FFFFFF'}
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
            {[...patternPoints, ...centerPoints].map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={getCircleSize(point.x, point.y, holeRadius)}
                fill={useStrokes ? 'none' : (invertColours ? 'white' : selectedColour)}
                stroke={useStrokes ? selectedColour : "none"}stroke={useStrokes ? (invertColours ? '#FFFFFF' : selectedColour) : 'none'}
                strokeWidth={useStrokes ? 0.5 : 0}
              />
            ))}
            {/*<circle cx="0" cy="0" r={radius} fill="none" stroke="black" strokeWidth="1"/>*/}
            {includeAlignmentMarks && (
              <>
                {/* Outer Circle */}
                <circle
                  cx={0}
                  cy={0}
                  r={radius}
                  stroke={invertColours ? '#FFFFFF' : selectedColour}
                  fill="none"
                />
                {/* Center Crosshair */}
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
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
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

          {/* Pattern Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dropdowns */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Pattern Type</label>
              <select 
                value={pattern} 
                onChange={(e) => setPattern(e.target.value as PatternType)}
                className="w-full border rounded p-2"
              >
                <option value="phyllotaxis">Phyllotaxis</option>
                <option value="fermat">Fermat Spiral</option>
                <option value="concentric">Concentric Rings</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Center Fill Algorithm</label>
              <select 
                value={centerAlgorithm} 
                onChange={(e) => setCenterAlgorithm(e.target.value as CenterFillAlgorithm)}
                className="w-full border rounded p-2"
              >
                <option value="force">Force-Directed</option>
                <option value="poisson">Poisson Disc</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Units</label>
              <select 
                value={units} 
                onChange={(e) => setUnits(e.target.value as Units)}
                className="w-full border rounded p-2"
              >
                <option value="mm">Millimeters</option>
                <option value="px">Pixels</option>
              </select>
            </div>

            {/* Sliders */}
            <SliderControl
              label="Overall Radius"
              value={radius}
              onChange={(newValue) => {
                console.log('Radius Change:', {
                  newValue,
                  inMm: newValue / MM_TO_PX,
                  units
                });
                setRadius(newValue);
              }}
              units={units}
              mmRange={[50, 500, 1]}
              pxRange={[200, 2000, 1]}
              precision={0}
            />
            <SliderControl
              label="Hole Size"
              value={holeRadius}
              onChange={setHoleRadius}
              units={units}
              mmRange={[0.5, 10, 0.5]}   // 0.5-10mm, 0.5mm steps
              pxRange={[2, 40, 0.5]}     // 2-40px, 0.5px steps
              precision={1}
            />

            <SliderControl
              label="Spacing"
              value={spacing}
              onChange={setSpacing}
              units={units}
              mmRange={[1, 30, 0.5]}     // 1-30mm, 0.5mm steps
              pxRange={[4, 120, 0.5]}    // 4-120px, 0.5px steps
              precision={1}
            />

            <SliderControl
              label="Center Area Size"
              value={centerExclusion}
              onChange={setCenterExclusion}
              units={units}
              mmRange={[0, 200, 5]}      // 0-200mm, 5mm steps
              pxRange={[0, 800, 5]}      // 0-800px, 5px steps
              precision={1}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Size Scaling (<FormattedValue value={sizeScaling} precision={2} />)
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

            {pattern !== 'concentric' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Divergence Angle (<FormattedValue value={divergenceAngle} units="°" precision={1} />)
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
              <SliderControl
                label="Ring Spacing"
                value={concentricSpacing}
                onChange={setConcentricSpacing}
                units={units}
                mmRange={[1, 30, 1]}     // 1-30mm, 1mm steps
                pxRange={[4, 120, 1]}    // 4-120px, 1px steps
                precision={1}
              />
            )}
          </div>

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

          {/* Stroke Mode Toggle */}
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

          

        </div>
      </div>
    </div>
  );
};

export default SpeakerGrille;
