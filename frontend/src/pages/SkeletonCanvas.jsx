import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const SkeletonCanvas = forwardRef(({ videoRef, isActive }, ref) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const handsRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getBase64Frame: () => {
      if (!canvasRef.current) return null;
      try {
        // Create a temporary canvas to ensure we get exactly 400x400
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 400;
        const ctx = tempCanvas.getContext('2d');
        
        // Draw the current canvas to the temp canvas (in case the display size is different)
        ctx.drawImage(canvasRef.current, 0, 0, 400, 400);
        
        // Convert canvas to base64 (remove data URL prefix)
        return tempCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      } catch (error) {
        console.error('Error converting canvas to base64:', error);
        return null;
      }
    }
  }));

  const drawFrame = async () => {
    if (!isActive || !videoRef.current || !handsRef.current) {
      animationRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    // Skip if video hasn't advanced to a new frame
    if (videoRef.current.currentTime === lastVideoTimeRef.current) {
      animationRef.current = requestAnimationFrame(drawFrame);
      return;
    }
    lastVideoTimeRef.current = videoRef.current.currentTime;

    try {
      await handsRef.current.send({ image: videoRef.current });
    } catch (error) {
      console.error('Error sending frame to MediaPipe:', error);
    }
    
    animationRef.current = requestAnimationFrame(drawFrame);
  };

  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        // Load MediaPipe Hands
        const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands');
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to 400x400
        canvas.width = 400;
        canvas.height = 400;

        // Initialize MediaPipe Hands
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
          if (!isActive) return;

          // Clear canvas with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 400, 400);

          if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
              // Draw hand connections (lines between landmarks)
              drawConnections(ctx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 3
              });

              // Draw hand landmarks (points)
              drawLandmarks(ctx, landmarks, {
                color: '#FF0000',
                radius: 4
              });
            }
          }
        });

        handsRef.current = hands;
        
        // Start the animation loop
        animationRef.current = requestAnimationFrame(drawFrame);

      } catch (error) {
        console.error('Error loading MediaPipe:', error);
        // Fallback: just draw a placeholder
        drawPlaceholder();
      }
    };

    if (isActive) {
      loadMediaPipe();
    } else {
      // Clear canvas when not active
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 400);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, videoRef]);

  const drawConnections = (ctx, landmarks, connections, style) => {
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;
    ctx.lineCap = 'round';

    for (const connection of connections) {
      const from = landmarks[connection[0]];
      const to = landmarks[connection[1]];

      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x * 400, from.y * 400);
        ctx.lineTo(to.x * 400, to.y * 400);
        ctx.stroke();
      }
    }
  };

  const drawLandmarks = (ctx, landmarks, style) => {
    ctx.fillStyle = style.color;

    for (const landmark of landmarks) {
      ctx.beginPath();
      ctx.arc(
        landmark.x * 400,
        landmark.y * 400,
        style.radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  const drawPlaceholder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 400;

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 400);

    // Placeholder text
    ctx.fillStyle = '#666';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Hand tracking will appear here',
      200,
      200
    );

    // Draw a simple hand outline as placeholder
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Simple hand shape
    ctx.moveTo(150, 250);
    ctx.lineTo(170, 180);
    ctx.lineTo(190, 160);
    ctx.lineTo(210, 170);
    ctx.lineTo(230, 180);
    ctx.lineTo(250, 250);
    ctx.stroke();
  };

  useEffect(() => {
    // Initialize with placeholder
    drawPlaceholder();
  }, []);

  return (
    <div className="skeleton-canvas-container">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: '12px'
        }}
      />
    </div>
  );
});

SkeletonCanvas.displayName = 'SkeletonCanvas';

export default SkeletonCanvas;