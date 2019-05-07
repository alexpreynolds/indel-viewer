import React from 'react';
import * as d3 from 'd3';

class IndelRelativeFrequencyViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      indels :          this.props.indels       || null,
      title:            this.props.title        || "Default",
      yAxisLabel :      this.props.yAxisLabel   || "Y-axis label",
      containerWidth :  this.props.viewerWidth  || 800,
      containerHeight : this.props.viewerHeight || 600,
      containerMargin:  this.props.viewerMargin || {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      },
      containerPadding: this.props.viewerPadding || {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      }
    }
  }
  
  render() {
    return (
      <div id="indel-relative-frequency-viewer">{this.state.title}</div>
    );
  }
}

export default IndelRelativeFrequencyViewer;