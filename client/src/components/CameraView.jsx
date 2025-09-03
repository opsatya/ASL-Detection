import React, { useRef, useEffect } from 'react';

export const CameraView = ({ videoRef, overlayRef, overlayOptions }) => {
  useEffect(() => {
    const canvas = overlayRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const drawOverlay = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Soft viewfinder with rounded corners
      ctx.strokeStyle = 'rgba(74,144,226,0.9)';
      ctx.lineWidth = 3;
      const radius = 16;
      const inset = 12;
      const x = inset, y = inset, rw = w - inset * 2, rh = h - inset * 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, radius);
      ctx.arcTo(x + rw, y + rh, x, y + rh, radius);
      ctx.arcTo(x, y + rh, x, y, radius);
      ctx.arcTo(x, y, x + rw, y, radius);
      ctx.closePath();
      ctx.stroke();

      // Optimal hand area guide
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(16,185,129,0.6)';
      const gw = rw * 0.6;
      const gh = rh * 0.6;
      ctx.strokeRect(x + (rw - gw) / 2, y + (rh - gh) / 2, gw, gh);
      ctx.setLineDash([]);

      raf = requestAnimationFrame(drawOverlay);
    };

    const resize = () => {
      const video = videoRef.current;
      if (!video) return;
      overlayRef.current.width = video.videoWidth || 640;
      overlayRef.current.height = video.videoHeight || 480;
    };

    resize();
    drawOverlay();
    return () => cancelAnimationFrame(raf);
  }, [videoRef, overlayRef, overlayOptions]);

  return (
    <div className="relative">
      <video ref={videoRef} className="w-full h-auto rounded-xl border border-gray-200" playsInline muted />
      <canvas ref={overlayRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};


