import { useState, useRef, useMemo } from 'react';
import { generatePatternPoints, PatternType } from './generatePatternPoints';
import { generateCenterPoints, CenterFillAlgorithm } from './centerFillAlgorithms';

type Units = 'px' | 'mm';
type ScaleType = 'linear' | 'exponential';

const pxToMm = (px: number) => px * 0.264583;
const getSize = (px: number, units: Units) => units === 'mm' ? pxToMm(px) : px;

const SpeakerGrille = () => {
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
  const [units, setUnits] = useState<Units>('px');
  const [centerAlgorithm, setCenterAlgorithm] = useState<CenterFillAlgorithm>('force');
  
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
    const svgData = units === 'mm' 
      ? svgRef.current.outerHTML.replace(/(\d+(\.\d+)?)px/g, (_, p1) => `${pxToMm(parseFloat(p1))}mm`)
      : svgRef.current.outerHTML;
    const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'speaker-grille.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const randomize = () => {
    setDivergenceAngle(Math.random() * 360);
    setSpacing(4 + Math.random() * 16);
    setHoleRadius(2 + Math.random() * 8);
    setSizeScaling(-1 + Math.random() * 2);
  };

  const resetDefaults = () => {
    setRadius(500);
    setHoleRadius(5);
    setDivergenceAngle(137.5);
    setNumPoints(2000);
    setSpacing(12);
    setCenterExclusion(0);
    setConcentricSpacing(20);
    setSizeScaling(0);
    setScaleType('linear');
    setUseStrokes(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="flex flex-col gap-6">
        {/* SVG Display */}
        <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <svg 
            ref={svgRef}
            viewBox={`${-radius-20} ${-radius-20} ${2*radius+40} ${2*radius+40}`}
            className="w-[90%] h-[90%] bg-white rounded-full"
          >
            <circle cx="0" cy="0" r={radius} fill="none" stroke="black" strokeWidth="1"/>
            {[...patternPoints, ...centerPoints].map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={getCircleSize(point.x, point.y, holeRadius)}
                fill={useStrokes ? "none" : "black"}
                stroke={useStrokes ? "black" : "none"}
                strokeWidth={useStrokes ? 0.5 : 0}
              />
            ))}
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
                <option value="px">Pixels</option>
                <option value="mm">Millimeters</option>
              </select>
            </div>

            {/* Sliders */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Overall Radius ({getSize(radius, units)}{units})
              </label>
              <input 
                type="range"
                min={200}
                max={1000}
                step={10}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Hole Size ({getSize(holeRadius, units)}{units})
              </label>
              <input 
                type="range"
                min={2}
                max={15}
                step={0.5}
                value={holeRadius}
                onChange={(e) => setHoleRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Minimum Clearance ({getSize(minClearance, units)}{units})
              </label>
              <input 
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={minClearance}
                onChange={(e) => setMinClearance(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Center Area Size ({getSize(centerExclusion, units)}{units})
              </label>
              <input 
                type="range"
                min={0}
                max={200}
                step={5}
                value={centerExclusion}
                onChange={(e) => setCenterExclusion(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Size Scaling ({sizeScaling})
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
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Divergence Angle ({divergenceAngle}°)
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Spacing ({getSize(spacing, units)}{units})
                  </label>
                  <input 
                    type="range"
                    min={4}
                    max={20}
                    step={0.5}
                    value={spacing}
                    onChange={(e) => setSpacing(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {pattern === 'concentric' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Ring Spacing ({getSize(concentricSpacing, units)}{units})
                </label>
                <input 
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={concentricSpacing}
                  onChange={(e) => setConcentricSpacing(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Stroke Mode Toggle */}
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="strokes"
              checked={useStrokes}
              onChange={(e) => setUseStrokes(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="strokes" className="text-sm font-medium">
              Use strokes (for CAD)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerGrille;
