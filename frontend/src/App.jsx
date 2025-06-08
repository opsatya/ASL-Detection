import React from 'react';
import styled from 'styled-components';
import Dashboard from './pages/Dashboard';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const ErrorContainer = styled.div`
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  
  h2 {
    color: #e53e3e;
    margin-bottom: 20px;
  }
  
  p {
    margin: 10px 0;
    color: #4a5568;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3182ce;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function App() {
  const [isBackendAlive, setIsBackendAlive] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Check if backend is available
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/');
        if (response.ok) {
          setIsBackendAlive(true);
        }
      } catch (error) {
        console.error('Backend not reachable:', error);
      } finally {
        setLoading(false);
      }
    };

    checkBackend();
  }, []);

  if (loading) {
    return (
      <LoadingContainer>
        <div className="spinner"></div>
        <p>Loading application...</p>
      </LoadingContainer>
    );
  }


  if (!isBackendAlive) {
    return (
      <ErrorContainer>
        <h2>Backend Server Unreachable</h2>
        <p>Please ensure the Flask backend server is running on http://localhost:5000</p>
        <p>1. Make sure you've started the Flask server</p>
        <p>2. Check that the server is running on the correct port (5000)</p>
        <p>3. Verify there are no CORS issues in the browser console</p>
      </ErrorContainer>
    );
  }

  return (
    <AppContainer>
      <Dashboard />
    </AppContainer>
  );
}

export default App;
