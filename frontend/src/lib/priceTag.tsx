interface PriceTagProps {
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
  value: number;
  color?: string;
}

/** Renders as the `label` of a recharts ReferenceLine - pins a filled price
 * tag to the right edge of the plot area, at the line's y position. */
export function PriceTag({ viewBox, value, color = "#eab308" }: PriceTagProps) {
  if (!viewBox) return null;
  const { x = 0, y = 0, width = 0 } = viewBox;
  const text = value.toFixed(2);
  const tagWidth = text.length * 7 + 14;
  const tagX = x + width + 4;

  return (
    <g>
      <rect x={tagX} y={y - 9} width={tagWidth} height={18} rx={3} fill={color} />
      <text x={tagX + tagWidth / 2} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1c1917">
        {text}
      </text>
    </g>
  );
}
