import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaPlay, FaStop, FaTrash, FaVolumeUp } from 'react-icons/fa';
import SkeletonCanvas from './SkeletonCanvas';

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
`;

const slideIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  color: white;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;

  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;

const VideoSection = styled.div`
  flex: 1;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding: 20px;
`;

const VideoContainer = styled.div`
  position: relative;
  background: #000;
  border-radius: 15px;
  overflow: hidden;
  padding-top: 75%; /* 4:3 Aspect Ratio for better hand tracking */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  
  /* Ensure child elements are absolutely positioned */
  & > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

const CanvasContainer = styled.div`
  position: relative;
  background: white;
  border-radius: 15px;
  overflow: hidden;
  padding-top: 75%; /* 4:3 Aspect Ratio matching webcam */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border: 3px solid #48bb78;
  
  /* Ensure child elements are absolutely positioned */
  & > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

const Video = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
`;

const ViewLabel = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  z-index: 10;
`;

const LiveIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e53e3e;
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 10;
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  margin-right: 6px;
  animation: ${blink} 1s infinite;
`;

const ButtonGroup = styled.div`
  padding: 30px;
  text-align: center;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    margin-right: 10px;
  }
`;

const StopButton = styled(Button)`
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
`;

const ResultsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.5s ease-out;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;

  ${props => props.variant === 'speak' && css`
    background: #e6f3ff;
    color: #2b6cb0;
    &:hover {
      background: #bee3f8;
    }
  `}

  ${props => props.variant === 'clear' && css`
    background: #fed7d7;
    color: #c53030;
    &:hover {
      background: #feb2b2;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PredictionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const PredictionBox = styled.div`
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const PredictionLabel = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
`;

const PredictionText = styled.p`
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
`;

const ConfidenceBadge = styled.span`
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  background-color: ${props => {
    if (props.confidence >= 80) return '#c6f6d5';
    if (props.confidence >= 60) return '#feebc8';
    return '#fed7d7';
  }};
  color: ${props => {
    if (props.confidence >= 80) return '#22543d';
    if (props.confidence >= 60) return '#7b341e';
    return '#c53030';
  }};
`;

const ErrorText = styled.div`
  color: #e53e3e;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-weight: 500;
`;

const LastUpdate = styled.div`
  font-size: 0.8rem;
  color: #718096;
  margin-top: 0.5rem;
`;

const SentenceDisplay = styled.div`
  background: #f7fafc;
  border-radius: 15px;
  padding: 25px;
  min-height: 100px;
  display: flex;
  align-items: center;
  border: 2px dashed #e2e8f0;
`;

const SentenceText = styled.p`
  font-size: 1.3rem;
  font-weight: 500;
  color: #2d3748;
  line-height: 1.6;
  margin: 0;
  
  ${props => !props.hasContent && css`
    color: #a0aec0;
    font-style: italic;
  `}
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
`;

const StatusLabel = styled.span`
  color: #718096;
  font-weight: 500;
`;

const StatusValue = styled.span`
  font-weight: 600;
  
  ${props => props.status === 'active' && css`
    color: #48bb78;
  `}
  
  ${props => props.status === 'inactive' && css`
    color: #e53e3e;
  `}
  
  ${props => props.status === 'processing' && css`
    color: #4299e1;
  `}
  
  ${props => props.status === 'neutral' && css`
    color: #2d3748;
  `}
`;

const Dashboard = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [prediction, setPrediction] = useState('-');
  const [confidence, setConfidence] = useState(0);
  const [wordBuffer, setWordBuffer] = useState('');
  const [finalSentence, setFinalSentence] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const lastPredictedWordRef = useRef('');
  const typingIntervalRef = useRef(null);
  const predictionIntervalRef = useRef(null);
  const skeletonCanvasRef = useRef(null);

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsDetecting(true);
        startPredictionLoop();
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      alert('Could not access webcam. Please ensure you have granted camera permissions.');
    }
  };

  const stopDetection = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear all intervals
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    setIsDetecting(false);
    setPrediction('-');
    setConfidence(0);
    setWordBuffer('');
    setIsTyping(false);
    setConnectionStatus('disconnected');
  };

  const animateTyping = (word) => {
    if (isTyping) return;
    
    setIsTyping(true);
    setWordBuffer('');
    let index = 0;
    
    typingIntervalRef.current = setInterval(() => {
      setWordBuffer(prev => prev + word[index]);
      index++;
      
      if (index >= word.length) {
        clearInterval(typingIntervalRef.current);
        
        setTimeout(() => {
          setFinalSentence(prev => {
            const newSentence = prev.trim() + (prev.trim() ? ' ' : '') + word;
            return newSentence;
          });
          setWordBuffer('');
          setIsTyping(false);
        }, 800);
      }
    }, 120);
  };

  const captureAndPredict = async () => {
    if (!skeletonCanvasRef.current) return;

    try {
      // Get base64 image from skeleton canvas instead of video
      const base64 = await skeletonCanvasRef.current.getBase64Frame();
      
      if (!base64) {
        console.log('No skeleton data available');
        return;
      }

      console.log("Sending skeleton frame for prediction...");
      
      // Send to Flask backend
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server responded with error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Prediction result:", result);
      
      if (result.status === 'success') {
        const pred = result.prediction;
        const conf = result.confidence;

        setPrediction(pred);
        setConfidence(Math.round(conf * 100));
        setConnectionStatus('connected');
        setLastUpdateTime(new Date().toLocaleTimeString());

        // Only animate if confidence is high enough, prediction is valid, and it's a new character
        if (conf >= 0.4 && pred && pred !== 'Uncertain' && pred !== 'Unknown' && 
            pred !== lastPredictedWordRef.current && !isTyping) {
          lastPredictedWordRef.current = pred;
          animateTyping(pred.toUpperCase());
        }
      } else {
        console.error('Prediction failed:', result.error);
        setPrediction('Error');
        setConfidence(0);
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setPrediction('Error');
      setConfidence(0);
      setConnectionStatus('error');
    }
  };

  const startPredictionLoop = () => {
    predictionIntervalRef.current = setInterval(() => {
      if (isDetecting) {
        captureAndPredict();
      } else {
        clearInterval(predictionIntervalRef.current);
      }
    }, 800);

    return () => clearInterval(predictionIntervalRef.current);
  };

  const clearSentence = () => {
    setFinalSentence('');
    setWordBuffer('');
    lastPredictedWordRef.current = '';
  };

  const speakSentence = () => {
    if (finalSentence && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(finalSentence);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
      }
    };
  }, []);

  return (
    <Container>
      <Header>
        <Title>Sign Language Detection</Title>
        <Subtitle>Real-time American Sign Language Recognition</Subtitle>
      </Header>

      <MainContent>
        {/* Video Section with Dual View */}
        <VideoSection>
          <VideoGrid>
            {/* Webcam Feed */}
            <VideoContainer>
              <Video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
              />
              <ViewLabel>Webcam Feed</ViewLabel>
              {isDetecting && (
                <LiveIndicator>
                  <LiveDot />
                  LIVE
                </LiveIndicator>
              )}
            </VideoContainer>

            {/* Skeleton Canvas */}
            <CanvasContainer>
              <SkeletonCanvas 
                videoRef={videoRef} 
                isActive={isDetecting} 
                ref={skeletonCanvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px'
                }}
              />
              <ViewLabel style={{ background: 'rgba(72, 187, 120, 0.9)' }}>
                Hand Tracking
              </ViewLabel>
            </CanvasContainer>
          </VideoGrid>
          
          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <ButtonGroup>
            {!isDetecting ? (
              <Button onClick={startDetection}>
                <FaPlay />
                Start Detection
              </Button>
            ) : (
              <StopButton onClick={stopDetection}>
                <FaStop />
                Stop Detection
              </StopButton>
            )}
          </ButtonGroup>
        </VideoSection>

        {/* Results Section */}
        <ResultsSection>
          {/* Current Word Card */}
          <Card>
            <CardTitle>Current Detection</CardTitle>
            <PredictionContainer>
              <PredictionBox>
                <PredictionLabel>Current Sign:</PredictionLabel>
                {prediction && prediction !== '-' && prediction !== 'Uncertain' && prediction !== 'Unknown' ? (
                  <PredictionText>
                    {prediction} 
                    <ConfidenceBadge confidence={confidence}>
                      {confidence}%
                    </ConfidenceBadge>
                  </PredictionText>
                ) : (
                  <PredictionText>Show a sign...</PredictionText>
                )}
              </PredictionBox>
              
              {connectionStatus === 'error' && (
                <ErrorText>⚠️ Connection error. Please check backend server.</ErrorText>
              )}
              
              {lastUpdateTime && (
                <LastUpdate>Last updated: {lastUpdateTime}</LastUpdate>
              )}
            </PredictionContainer>
          </Card>

          {/* Sentence Building Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sentence Builder</CardTitle>
              <ButtonRow>
                <IconButton 
                  variant="speak" 
                  onClick={speakSentence}
                  disabled={!finalSentence}
                  title="Speak sentence"
                >
                  <FaVolumeUp />
                </IconButton>
                <IconButton 
                  variant="clear" 
                  onClick={clearSentence}
                  title="Clear sentence"
                >
                  <FaTrash />
                </IconButton>
              </ButtonRow>
            </CardHeader>
            <SentenceDisplay>
              <SentenceText hasContent={!!finalSentence}>
                {finalSentence || 'Your sentence will appear here as you sign...'}
              </SentenceText>
            </SentenceDisplay>
          </Card>

          {/* Status Card */}
          <Card>
            <CardTitle>Detection Status</CardTitle>
            <StatusGrid>
              <StatusItem>
                <StatusLabel>Camera:</StatusLabel>
                <StatusValue status={isDetecting ? 'active' : 'inactive'}>
                  {isDetecting ? 'Active' : 'Inactive'}
                </StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Backend:</StatusLabel>
                <StatusValue status={connectionStatus === 'connected' ? 'active' : 
                                   connectionStatus === 'error' ? 'inactive' : 'neutral'}>
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'error' ? 'Error' : 'Disconnected'}
                </StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Processing:</StatusLabel>
                <StatusValue status={isTyping ? 'processing' : 'neutral'}>
                  {isTyping ? 'Typing...' : 'Ready'}
                </StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Characters:</StatusLabel>
                <StatusValue status="neutral">
                  {finalSentence.length}
                </StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Hand Tracking:</StatusLabel>
                <StatusValue status={isDetecting ? 'active' : 'inactive'}>
                  {isDetecting ? 'Active' : 'Inactive'}
                </StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Last Update:</StatusLabel>
                <StatusValue status="neutral">
                  {lastUpdateTime || 'None'}
                </StatusValue>
              </StatusItem>
            </StatusGrid>
          </Card>
        </ResultsSection>
      </MainContent>
    </Container>
  );
};

export default Dashboard;