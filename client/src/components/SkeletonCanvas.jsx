import React, { useEffect, useRef } from 'react';

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17]
];

export const SkeletonCanvas = ({ canvasRef, landmarks, options }) => {
  const lastLandmarksRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const lm = landmarks || lastLandmarksRef.current;
      if (lm) {
        // Connections
        ctx.strokeStyle = options?.color || '#10B981';
        ctx.globalAlpha = options?.opacity ?? 1;
        ctx.lineWidth = options?.thickness || 3;
        ctx.lineCap = 'round';
        CONNECTIONS.forEach(([a,b]) => {
          const s = lm[a]; const e = lm[b];
          if (!s || !e) return;
          ctx.beginPath();
          ctx.moveTo(s.x * w, s.y * h);
          ctx.lineTo(e.x * w, e.y * h);
          ctx.stroke();
        });

        // Points
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ef4444';
        lm.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, options?.dotSize || 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, landmarks, options]);

  useEffect(() => {
    if (landmarks) lastLandmarksRef.current = landmarks;
  }, [landmarks]);

  return null;
};


