// FormattedValue.tsx
import React from 'react';

interface FormattedValueProps {
  value: number;
  units?: 'px' | 'mm' | '°' | '';
  precision?: number;
  minWidth?: number;
}

const pxToMm = (px: number) => px * 0.264583;

export const FormattedValue: React.FC<FormattedValueProps> = ({ 
  value, 
  units = '', 
  precision = 1,
  minWidth = 4
}) => {
  const displayValue = units === 'mm' ? pxToMm(value) : value;
  const formattedValue = displayValue.toFixed(precision);
  
  // Pad with non-breaking spaces to ensure consistent width
  // const paddedValue = formattedValue.padStart(minWidth, '\u00A0');
  
  return (
    <span className="font-mono tabular-nums">
      {formattedValue}{units}
    </span>
  );
};
