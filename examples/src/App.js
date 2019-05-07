import React from 'react';
import './App.css';

import IndelRelativeFrequencyViewer from '../../src';

function App() {
  return (
    <div className="demo-parent-container">
      <div className="demo-viewer-parent-container">
        <IndelRelativeFrequencyViewer
          title="Indel Relative Frequency Viewer" />
      </div>
    </div>
  );
}

export default App;
