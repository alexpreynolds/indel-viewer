import React from 'react';
import * as d3 from 'd3';

class IndelRelativeFrequencyViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      indels :                     this.props.indels || null,
      viewerTitle :                "No title",
      viewerTitleColor :           "rgba(0, 0, 0, 0.95)",
      viewerTitleFontWeight :      "600",
      viewerTitleFontSize :        "1.4em",
      viewerTitleTextAlign:        "center",
      containerBorderWidth:        "1px",
      containerBorderColor:        "rgba(0, 0, 0, 0.15)",
      containerBorderStyle:        "solid",
      containerBoxSizing:          "content-box",
      containerWidth :             800,
      containerHeight :            600,
      containerMargin :            {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      },
      containerPadding :           {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      },
      containerBackgroundColor :   "rgba(0, 0, 0, 0.05)",
      yAxisLabel :                 "No y-axis label",
      xAxisLabel :                 "No x-axis label"
    }
  }
  
  render() {
    let correctedWidth = parseInt(this.props.viewerWidth || this.state.containerWidth) - (this.state.containerMargin.left + this.state.containerMargin.right + this.state.containerPadding.left + this.state.containerPadding.right) + "px";
    let correctedHeight = parseInt(this.props.viewerHeight || this.state.containerHeight) - (this.state.containerMargin.top + this.state.containerMargin.bottom + this.state.containerPadding.top + this.state.containerPadding.bottom) + "px";
    return (
      <div id="irf-container" style={{
        width: correctedWidth,
        height: correctedHeight,
        backgroundColor: this.props.viewerBackgroundColor || this.state.containerBackgroundColor, 
        borderWidth: this.props.viewerBorderWidth || this.state.containerBorderWidth,
        borderColor: this.props.viewerBorderColor || this.state.containerBorderColor,
        borderStyle: this.props.viewerBorderStyle || this.state.containerBorderStyle,
        boxSizing: this.props.viewerBoxSizing || this.state.containerBoxSizing,
        marginTop: (this.props.viewerMargin && this.props.viewerMargin.top) || this.state.containerMargin.top, 
        marginBottom: (this.props.viewerMargin && this.props.viewerMargin.bottom) || this.state.containerMargin.bottom, 
        marginLeft: (this.props.viewerMargin && this.props.viewerMargin.left) || this.state.containerMargin.left, 
        marginRight: (this.props.viewerMargin && this.props.viewerMargin.right) || this.state.containerMargin.right, 
        paddingTop: (this.props.viewerPadding && this.props.viewerPadding.top) || this.state.containerPadding.top, 
        paddingBottom: (this.props.viewerPadding && this.props.viewerPadding.bottom) || this.state.containerPadding.bottom, 
        paddingLeft: (this.props.viewerPadding && this.props.viewerPadding.left) || this.state.containerPadding.left, 
        paddingRight: (this.props.viewerPadding && this.props.viewerPadding.right) || this.state.containerPadding.right}}>
        <div id="irf-container-title" style={{
          textAlign: this.props.viewerTitleTextAlign || this.state.viewerTitleTextAlign,
          fontSize: this.props.viewerTitleFontSize || this.state.viewerTitleFontSize,
          fontWeight: this.props.viewerTitleFontWeight || this.state.viewerTitleFontWeight,
          color: this.props.viewerTitleColor || this.state.viewerTitleColor,
        }}>
          {this.props.viewerTitle || this.state.viewerTitle}
        </div>
      </div>
    );
  }
}

export default IndelRelativeFrequencyViewer;