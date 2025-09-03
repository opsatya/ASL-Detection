import React from 'react';

export const PredictionPanel = ({ prediction, confidence, detectedText, onClear, onSpeak, suggestions = [] }) => {
  const pct = Math.round((confidence || 0) * 100);
  const meterColor = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Prediction</h2>

      <div className="relative overflow-hidden rounded-xl bg-gray-50 p-6 text-center">
        <div className="text-7xl font-extrabold" style={{ color: '#4A90E2' }}>{prediction || '?'}</div>
        <div className="mt-3 text-sm text-gray-600">Confidence</div>
        <div className="h-2 w-full bg-gray-200 rounded-full mt-2">
          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: meterColor, transition: 'width 350ms ease' }} />
        </div>
      </div>

      {suggestions?.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">Alternatives</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ background: '#EEF2FF', color: '#6366F1' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Detected Text</label>
        <div className="bg-gray-50 rounded-lg p-3 min-h-[100px] font-mono">{detectedText || 'Start signing to see results...'}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onClear} className="px-4 py-2 rounded-lg text-white" style={{ background: '#6B7280' }}>Clear</button>
          <button onClick={onSpeak} disabled={!detectedText} className="px-4 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: '#10B981' }}>Speak</button>
        </div>
      </div>
    </div>
  );
};


