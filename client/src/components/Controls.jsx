import React from 'react';

export const Controls = ({ isProcessing, autoSend, setAutoSend, onPredict }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Controls</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input id="auto" type="checkbox" className="rounded" checked={autoSend} onChange={e => setAutoSend(e.target.checked)} />
          <label htmlFor="auto" className="text-sm">Auto-predict</label>
        </div>
        <button onClick={onPredict} disabled={isProcessing} className="px-4 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: '#4A90E2' }}>
          {isProcessing ? 'Processing...' : 'Predict'}
        </button>
      </div>
    </div>
  );
};


