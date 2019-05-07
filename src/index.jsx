import React from 'react';
import * as d3 from 'd3';

class IndelRelativeFrequencyViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      indels : null,
      title: null,
      yAxisLabel : null,
      containerWidth : 800,
      containerHeight : 600,
      containerMargin: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      }
    }
  }
  
  render() {
    return (
      <div id="indel-relative-frequency-view"></div>
    );
  }
}

export default IndelRelativeFrequencyViewer;