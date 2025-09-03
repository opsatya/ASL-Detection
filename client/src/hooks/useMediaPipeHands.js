import { useEffect, useRef, useState } from 'react';
import { Hands } from "@mediapipe/hands";
import { Camera as CameraUtils } from "@mediapipe/camera_utils";

export const useMediaPipeHands = (videoRef, onLandmarks) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      try {
        handsRef.current = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        handsRef.current.onResults((results) => {
          const now = performance.now();
          const dt = now - lastTimeRef.current;
          lastTimeRef.current = now;
          if (dt > 0) setFps(Math.min(60, Math.round(1000 / dt)));

          const lm = results.multiHandLandmarks?.[0] || null;
          if (lm && onLandmarks) onLandmarks(lm);
        });

        cameraRef.current = new CameraUtils(videoRef.current, {
          onFrame: async () => {
            await handsRef.current.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });

        await cameraRef.current.start();
        if (isMounted) setIsInitialized(true);
      } catch (e) {
        console.error(e);
        if (isMounted) setError(e.message || 'Camera initialization failed');
      }
    };

    initialize();
    return () => {
      isMounted = false;
      try {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks()?.forEach((t) => t.stop());
      } catch {}
    };
  }, [videoRef, onLandmarks]);

  return { isInitialized, error, fps };
};


