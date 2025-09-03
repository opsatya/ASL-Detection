import React, { useState, useRef, useCallback } from 'react';
import { Camera as CameraIcon, Square } from 'lucide-react';
import { useMediaPipeHands } from './hooks/useMediaPipeHands';
import { CameraView } from './components/CameraView';
import { SkeletonCanvas } from './components/SkeletonCanvas';
import { PredictionPanel } from './components/PredictionPanel';
import { Controls } from './components/Controls';

// Modular hook and components are imported from ./hooks and ./components

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

// Drawing handled by SkeletonCanvas


// Utility functions
const canvasToBase64 = (canvas) => {
  return canvas.toDataURL('image/png');
};

const sendToBackend = async (imageBase64) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/predict', {
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
  const overlayRef = useRef(null);
  const skeletonRef = useRef(null);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [autoSend, setAutoSend] = useState(false);
  const [landmarks, setLandmarks] = useState(null);

  const handleResults = useCallback((lm) => {
    setLandmarks(lm);
  }, []);

  const { isInitialized, error } = useMediaPipeHands(videoRef, handleResults);

  const handlePredict = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Capture raw video frame and send to backend; canvas is for skeleton preview
      const video = videoRef.current;
      if (!video) return;
      const capCanvas = document.createElement('canvas');
      capCanvas.width = video.videoWidth || 640;
      capCanvas.height = video.videoHeight || 480;
      const capCtx = capCanvas.getContext('2d');
      capCtx.drawImage(video, 0, 0, capCanvas.width, capCanvas.height);
      const base64Image = canvasToBase64(capCanvas);
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
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CameraIcon className="mr-2" />
              Camera Feed
            </h2>
            <CameraView videoRef={videoRef} overlayRef={overlayRef} />
          </div>

          {/* Hand Skeleton Canvas */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Square className="mr-2" />
              Hand Skeleton
            </h2>
            <canvas ref={skeletonRef} className="w-full h-auto border-2 border-gray-300 rounded bg-white" />
            <SkeletonCanvas canvasRef={skeletonRef} landmarks={landmarks} options={{ color: '#10B981', opacity: 0.9, thickness: 3 }} />
          </div>

          {/* Prediction Panel */}
          <PredictionPanel prediction={prediction} confidence={confidence} detectedText={detectedText} onClear={handleClear} onSpeak={handleSpeak} />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controls isProcessing={isProcessing} autoSend={autoSend} setAutoSend={setAutoSend} onPredict={handlePredict} />
        </div>
      </div>
    </div>
  );
};

export default ASLDetectionApp;