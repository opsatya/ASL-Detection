import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera as CameraIcon, Square, Mic, RotateCcw, Send } from 'lucide-react';
import { Hands } from "@mediapipe/hands";
import { Camera as CameraUtils } from "@mediapipe/camera_utils";

// MediaPipe Hands Hook
const useMediaPipeHands = (videoRef, canvasRef, onResults) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
  const initializeMediaPipe = async () => {
  try {
    handsRef.current = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    handsRef.current.onResults((results) => {
      const ctx = canvasRef.current.getContext("2d");
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Clear canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height);
        onResults?.(landmarks);
      }
    });

    cameraRef.current = new CameraUtils(videoRef.current, {
      onFrame: async () => {
        await handsRef.current.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current.start();
    setIsInitialized(true);
  } catch (err) {
    console.error("MediaPipe error:", err);
    setError(err.message);
  }
};


    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            processFrame();
          };
        }
      } catch (err) {
        setError('Camera access denied');
      }
    };

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Clear canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Simulate hand landmarks (in real app, these come from MediaPipe)
      const mockLandmarks = generateMockHandLandmarks(canvas.width, canvas.height);
      
      if (mockLandmarks.length > 0) {
        drawHandSkeleton(ctx, mockLandmarks, canvas.width, canvas.height);
        onResults?.(mockLandmarks);
      }

      // Continue processing frames
      requestAnimationFrame(processFrame);
    };

    initializeMediaPipe();

    return () => {
      // Cleanup
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [videoRef, canvasRef, onResults]);

  return { isInitialized, error };
};

// Mock hand landmarks generator (replace with actual MediaPipe data)
// const generateMockHandLandmarks = (width, height) => {
//   const centerX = width * 0.5;
//   const centerY = height * 0.5;
//   const time = Date.now() * 0.001;
  
//   // Generate 21 hand landmarks (MediaPipe standard)
//   const landmarks = [];
//   for (let i = 0; i < 21; i++) {
//     const angle = (i / 21) * Math.PI * 2 + time;
//     const radius = 50 + Math.sin(time + i) * 20;
//     landmarks.push({
//       x: (centerX + Math.cos(angle) * radius) / width,
//       y: (centerY + Math.sin(angle) * radius) / height,
//       z: 0
//     });
//   }
  
//   return landmarks;
// };

// Hand skeleton drawing function
// const drawHandSkeleton = (ctx, landmarks, width, height) => {
//   // MediaPipe hand connections
//   const connections = [
//     [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
//     [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
//     [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
//     [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
//     [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
//     [5, 9], [9, 13], [13, 17] // Palm connections
//   ];

//   // Draw connections
//   ctx.strokeStyle = '#00ff00';
//   ctx.lineWidth = 3;
//   ctx.lineCap = 'round';

//   connections.forEach(([start, end]) => {
//     if (landmarks[start] && landmarks[end]) {
//       const startPoint = {
//         x: landmarks[start].x * width,
//         y: landmarks[start].y * height
//       };
//       const endPoint = {
//         x: landmarks[end].x * width,
//         y: landmarks[end].y * height
//       };

//       ctx.beginPath();
//       ctx.moveTo(startPoint.x, startPoint.y);
//       ctx.lineTo(endPoint.x, endPoint.y);
//       ctx.stroke();
//     }
//   });

//   // Draw landmarks as small circles
//   ctx.fillStyle = '#00ff00';
//   landmarks.forEach(landmark => {
//     const x = landmark.x * width;
//     const y = landmark.y * height;
//     ctx.beginPath();
//     ctx.arc(x, y, 4, 0, 2 * Math.PI);
//     ctx.fill();
//   });
// };


// Utility functions
const canvasToBase64 = (canvas) => {
  return canvas.toDataURL('image/png');
};

const sendToBackend = async (imageBase64) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Backend request failed:', error);
    // Return mock prediction for demo
    return { 
      prediction: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      confidence: Math.random() * 0.5 + 0.5
    };
  }
};

// Main App Component
const ASLDetectionApp = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [autoSend, setAutoSend] = useState(false);

  const handleResults = useCallback((landmarks) => {
    // This is called whenever new hand landmarks are detected
    if (autoSend && !isProcessing) {
      handlePredict();
    }
  }, [autoSend, isProcessing]);

  const { isInitialized, error } = useMediaPipeHands(videoRef, canvasRef, handleResults);

  const handlePredict = async () => {
    if (!canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const base64Image = canvasToBase64(canvasRef.current);
      const result = await sendToBackend(base64Image);
      
      setPrediction(result.prediction);
      setConfidence(result.confidence);
      
      // Add to detected text
      setDetectedText(prev => prev + result.prediction);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setDetectedText('');
    setPrediction('');
    setConfidence(0);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window && detectedText) {
      const utterance = new SpeechSynthesisUtterance(detectedText);
      speechSynthesis.speak(utterance);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          ASL Detection System
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Webcam Feed */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CameraIcon className="mr-2" />
              Camera Feed
            </h2>
            <div className="relative">
              <video 
                ref={videoRef}
                className="w-full h-auto rounded border-2 border-gray-300"
                playsInline
                muted
              />
              {!isInitialized && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hand Skeleton Canvas */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Square className="mr-2" />
              Hand Skeleton
            </h2>
            <canvas 
              ref={canvasRef}
              className="w-full h-auto border-2 border-gray-300 rounded bg-white"
            />
          </div>

          {/* Prediction Panel */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4">
              Prediction Results
            </h2>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {prediction || '?'}
                </div>
                <div className="text-sm text-gray-600">
                  Confidence: {(confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detected Text:
                </label>
                <div className="bg-gray-50 p-3 rounded min-h-[100px] text-lg font-mono">
                  {detectedText || 'Start signing to see results...'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSend"
                    checked={autoSend}
                    onChange={(e) => setAutoSend(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoSend" className="text-sm">
                    Auto-predict
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePredict}
                  disabled={isProcessing}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Predict'}
                </button>
                
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </button>
              </div>

              <button
                onClick={handleSpeak}
                disabled={!detectedText}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <Mic className="mr-2 h-4 w-4" />
                Speak Text
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Position your hand in front of the camera. Green lines show detected hand skeleton.</p>
          <p>Click "Predict" to analyze the current gesture, or enable "Auto-predict" for continuous detection.</p>
        </div>
      </div>
    </div>
  );
};

export default ASLDetectionApp;