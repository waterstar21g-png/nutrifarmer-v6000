'use client';

import type { ViewTrendPoint } from '@/lib/itemscout/types';

interface Props {
  data: ViewTrendPoint[];
  height?: number;
}

export function ViewTrendChart({ data, height = 140 }: Props) {
  if (!data.length) {
    return <p className="scout-chart__empty">조회 추세 데이터가 없습니다.</p>;
  }

  const pad = { top: 12, right: 8, bottom: 28, left: 36 };
  const width = 320;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxViews = Math.max(...data.map(d => d.views), 1);
  const minViews = Math.min(...data.map(d => d.views));
  const range = Math.max(maxViews - minViews, maxViews * 0.2, 1);

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = pad.top + innerH - ((d.views - minViews) / range) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`;

  const yTicks = [0, 0.5, 1].map(t => ({
    value: Math.round(minViews + range * (1 - t)),
    y: pad.top + innerH * t,
  }));

  return (
    <svg
      className="scout-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="최근 1주간 조회 추세 그래프"
    >
      <defs>
        <linearGradient id="scoutAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a5fa8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1a5fa8" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map(t => (
        <g key={t.value}>
          <line
            x1={pad.left}
            y1={t.y}
            x2={width - pad.right}
            y2={t.y}
            className="scout-chart__grid"
          />
          <text x={pad.left - 6} y={t.y + 4} textAnchor="end" className="scout-chart__axis">
            {formatCompact(t.value)}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#scoutAreaGrad)" />
      <path d={linePath} className="scout-chart__line" fill="none" />

      {points.map(p => (
        <g key={p.date}>
          <circle cx={p.x} cy={p.y} r={3.5} className="scout-chart__dot" />
          <text x={p.x} y={height - 6} textAnchor="middle" className="scout-chart__label">
            {p.date}
          </text>
        </g>
      ))}
    </svg>
  );
}

function formatCompact(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}
