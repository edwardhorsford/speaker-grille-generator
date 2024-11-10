import React, { useEffect } from 'react';
import { FormattedValue } from './FormattedValue';
import { MM_TO_PX, Units } from '../constants';

interface SliderControlProps {
  label: string;
  value: number;  // Value is always in pixels internally
  onChange: (value: number) => void;
  units: Units;
  mmRange: [number, number, number];  // [min, max, step] in mm
  pxRange: [number, number, number];  // [min, max, step] in px
  precision?: number;
}

export const SliderControl: React.FC<SliderControlProps> = ({ 
  label, 
  value, 
  onChange,
  units,
  mmRange,
  pxRange,
  precision = 1
}) => {
  const isMillimeters = units === 'mm';
  
  // For debugging
  useEffect(() => {
    console.log(`${label} Control:`, {
      internalValue: value,
      displayValue: isMillimeters ? value / MM_TO_PX : value,
      range: isMillimeters ? mmRange : pxRange,
      units
    });
  }, [value, units, label, mmRange, pxRange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = Number(e.target.value);
    const newValue = isMillimeters ? inputValue * MM_TO_PX : inputValue;
    
    console.log(`${label} Change:`, {
      input: inputValue,
      converted: newValue,
      units
    });
    
    onChange(newValue);
  };

  // Convert for display and slider value
  const displayValue = isMillimeters ? value / MM_TO_PX : value;
  const [min, max, step] = isMillimeters ? mmRange : pxRange;

  // For debugging
  console.log(`${label} Render:`, {
    displayValue,
    range: [min, max, step],
    units
  });

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label} (
        <FormattedValue 
          value={value}
          units={units} 
          precision={precision}
        />
        )
      </label>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        className="w-full"
      />
      {/* Debug display */}
      <div className="text-xs text-gray-500">
        Internal: {value.toFixed(2)}px / Display: {displayValue.toFixed(2)}{units}
      </div>
    </div>
  );
};
