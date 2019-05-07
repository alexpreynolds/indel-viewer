import React from 'react';
import IndelRelativeFrequencyViewer from '../../src';

class App extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      viewerTitle: "",
      windowHeight: 0,
      windowWidth: 0,
      viewerHeight: 0,
      viewerWidth: 0,
    };
  }
  
  componentDidMount() {
    setTimeout(() => { 
      this.updateViewportDimensions();
    }, 100);
    window.addEventListener("resize", this.updateViewportDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateViewportDimensions);
  }
  
  updateViewportDimensions = () => {
    let windowInnerHeight = window.innerHeight + "px";
    let windowInnerWidth = window.innerWidth + "px";
    let viewerHeight = windowInnerHeight;
    let viewerWidth = windowInnerWidth;
    this.setState({
      windowHeight: windowInnerHeight,
      windowWidth: windowInnerWidth,
      viewerHeight: viewerHeight,
      viewerWidth: viewerWidth,
      viewerTitle: viewerWidth + " × " + viewerHeight
    });
  }
  
  render() {
    return (
      <div className="demo-parent-container">
        <div className="demo-viewer-parent-container">
          <IndelRelativeFrequencyViewer
            viewerTitle={this.state.viewerTitle}
            viewerHeight={this.state.viewerHeight}
            viewerWidth={this.state.viewerWidth} />
        </div>
      </div>
    );
  }  
}

export default App;
