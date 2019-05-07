import React from 'react';
import IndelRelativeFrequencyViewer from '../../src';
import SplitPane from 'react-split-pane';

class App extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      viewerTitle: "",
      windowHeight: 0,
      windowWidth: 0,
      viewerHeight: 0,
      viewerWidth: 0,
      viewerBorderWidth: 1,
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
    let leftPaneWidth = parseInt(document.getElementById("demo-viewer-left-pane").offsetWidth) + "px"
    let windowInnerHeight = window.innerHeight + "px";
    let windowInnerWidth = window.innerWidth + "px";
    let viewerHeight = (parseInt(windowInnerHeight) - 2*(this.state.viewerBorderWidth)) + "px";
    let viewerWidth = (parseInt(windowInnerWidth) - parseInt(leftPaneWidth) - 2*(this.state.viewerBorderWidth)) + "px";
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
      <div className="demo-viewer-parent">
        <div className="demo-viewer-container">
          <SplitPane defaultSize={400} minSize={300} maxSize={400} split="vertical" primary="first" onDragFinished={()=>{this.updateViewportDimensions()}}>
            <div className="App-pane App-leftPane" id="demo-viewer-left-pane">
            </div>
            <div className="App-pane App-rightPane">
              <IndelRelativeFrequencyViewer
                viewerTitle={this.state.viewerTitle}
                viewerHeight={this.state.viewerHeight}
                viewerWidth={this.state.viewerWidth}
                viewerBorderWidth={this.state.viewerBorderWidth} />
            </div>
          </SplitPane>
        </div>
      </div>
    );
  }  
}

export default App;
