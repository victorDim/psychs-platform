import React, { useEffect, useRef } from 'react';
import { DimensionScore } from '../../types';
import { Radar } from 'lucide-react';

interface Props {
  dimensions: DimensionScore[];
}

export const PerceptionRadar: React.FC<Props> = ({ dimensions }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 38;

    ctx.clearRect(0, 0, width, height);

    const numAxes = dimensions.length;
    const angleStep = (Math.PI * 2) / numAxes;

    // 1. Draw polygon grid levels (20%, 40%, 60%, 80%, 100%)
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    levels.forEach((lvl) => {
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius * lvl);
        const y = centerY + Math.sin(angle) * (radius * lvl);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = lvl === 1.0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 2. Draw axis lines & labels
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const endX = centerX + Math.cos(angle) * radius;
      const endY = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // Label positioning
      const labelDist = radius + 22;
      const labelX = centerX + Math.cos(angle) * labelDist;
      const labelY = centerY + Math.sin(angle) * labelDist;

      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = labelX > centerX + 10 ? 'left' : labelX < centerX - 10 ? 'right' : 'center';
      ctx.textBaseline = 'middle';

      // Short label name
      const shortName = dim.name.split('&')[0].replace('Generative', 'Gen').replace('Attributability', 'Attr').trim();
      ctx.fillText(shortName, labelX, labelY);
    });

    // 3. Draw Data Polygon
    ctx.beginPath();
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const scoreRatio = Math.max(0, Math.min(100, dim.penalized_score)) / 100;
      const x = centerX + Math.cos(angle) * (radius * scoreRatio);
      const y = centerY + Math.sin(angle) * (radius * scoreRatio);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Fill gradient
    const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.15)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Draw data point vertices
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const scoreRatio = Math.max(0, Math.min(100, dim.penalized_score)) / 100;
      const x = centerX + Math.cos(angle) * (radius * scoreRatio);
      const y = centerY + Math.sin(angle) * (radius * scoreRatio);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [dimensions]);

  return (
    <div className="glass-panel p-5 flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
          <Radar className="w-4 h-4 text-emerald-400" />
          7-Dimensional Perception Radar
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">Penalized s_i·(1-U_i)</span>
      </div>

      <div className="relative my-2">
        <canvas ref={canvasRef} width={360} height={320} className="max-w-full h-auto" />
      </div>

      <div className="w-full flex justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
        <span>Target Threshold: <strong className="text-emerald-400">80.0+</strong></span>
        <span>Current Mean: <strong className="text-cyan-400">86.8</strong></span>
      </div>
    </div>
  );
};
