import React from 'react';
import SplitPane from 'react-split-pane';
import { CardBody, CardTitle, Card, Form, FormGroup, Input } from 'reactstrap';
import reactCSS from 'reactcss';
import { SketchPicker } from 'react-color';

// Application constants
import * as Constants from "./Constants.js";

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
      viewerBorderWidth: 1,
      indelsAsObj: Constants.defaultIndelObj,
      indelsAsStr: JSON.stringify(Constants.defaultIndelObj, null, 2),
      indelsMsg: "",
      displayColorPickers: {
        'NHEJ' : false,
        'MMEJ' : false
      },
      colors: {
        'NHEJ' : { r: '0', g: '0', b: '0', a: '1' },
        'MMEJ' : { r: '0', g: '139', b: '2', a: '1' },
      }
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
      viewerWidth: viewerWidth
    });
  }
  
  handleChange = (e) => {
    if (e.target.name === "indels") {
      this.setState({
        indelsAsStr: e.target.value
      }, () => {
        try {
          let indelsAsObj = JSON.parse(this.state.indelsAsStr);
          this.setState({
            indelsAsObj: indelsAsObj,
            indelsMsg: ""
          }, () => { console.log(this.state.indelsAsObj) });
        }
        catch(err) {
          this.setState({
            indelsMsg: err.message
          })
        }
      });
    }
  }
  
  handleClick = (e, name) => {
    //let name = e.target.name;
    let dcp = {...this.state.displayColorPickers};
    dcp[name] = !dcp[name];
    console.log(name);
    console.log(dcp);
    this.setState({ displayColorPickers: dcp });
  };

  handleClose = (e, name) => {
    console.log('name', name);
    let dcp = {...this.state.displayColorPickers};
    dcp[name] = false;
    this.setState({ displayColorPickers: dcp });
  };

  handleChange = (color, name) => {
    console.log('color', color);
    console.log('name', name);
    let cs = {...this.state.colors};
    cs[name] = color.rgb;
    this.setState({ colors: cs }, ()=>{ /* this.handleClose(null, name) */ });
  };
  
  render() {
    
    const pickerStyles = reactCSS({
      'default': {
        color: {
          width: '14px',
          height: '14px',
          borderRadius: '2px'
        },
        MMEJ: {
          background: `rgba(${ this.state.colors.MMEJ.r }, ${ this.state.colors.MMEJ.g }, ${ this.state.colors.MMEJ.b }, ${ this.state.colors.MMEJ.a })`,
        },
        NHEJ: {
          background: `rgba(${ this.state.colors.NHEJ.r }, ${ this.state.colors.NHEJ.g }, ${ this.state.colors.NHEJ.b }, ${ this.state.colors.NHEJ.a })`,
        },
        swatch: {
          padding: '3px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    })
    
    let MMEJStyles = {};
    Object.assign(MMEJStyles, pickerStyles.color, pickerStyles.MMEJ);
    
    let NHEJStyles = {};
    Object.assign(NHEJStyles, pickerStyles.color, pickerStyles.NHEJ);
    
    return (
      <div className="demo-viewer-parent">
        <div className="demo-viewer-container">
          <SplitPane defaultSize={400} minSize={300} maxSize={400} split="vertical" primary="first" onDragFinished={()=>{this.updateViewportDimensions()}}>
            <div className="App-pane App-leftPane" id="demo-viewer-left-pane">
              <div className="demo-view-settings">

                <Card>
                  <CardBody>
                    <CardTitle>
                      Indel data object
                    </CardTitle>
                    <div className="card-text">
                      <Form>
                        <FormGroup>
                          <Input className="demo-view-settings-textarea" type="textarea" name="indels" id="indels" value={this.state.indelsAsStr} onChange={(e)=>{ this.handleChange(e) }} />
                        </FormGroup>
                      </Form>
                      <div className="card-text-warning">
                        {this.state.indelsMsg}
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                <Card style={{marginTop:'15px'}}>
                  <CardBody>
                    <CardTitle>
                      Display parameters
                    </CardTitle>
                    <div className="card-text">
                      <Card>
                        <CardBody>
                          <CardTitle>
                            End-join color
                          </CardTitle>
                          <div className="card-text">
                            
                            <div className="card-swatch-container">
                              <div className="card-swatch">
                                <div style={ pickerStyles.swatch } name='MMEJ' onClick={(e)=>{this.handleClick(e,'MMEJ')} }>
                                  <div style={ MMEJStyles } />
                                </div>
                              </div>
                              <div className="card-swatch-label">
                                MMEJ
                              </div>
                            </div>
                            { this.state.displayColorPickers.MMEJ ? <div style={ pickerStyles.popover }>
                              <div style={ pickerStyles.cover } name='MMEJ' onClick={(e)=>this.handleClose(e,'MMEJ')}/>
                              <SketchPicker color={ this.state.colors.MMEJ } name='MMEJ' onChangeComplete={(c)=>this.handleChange(c,'MMEJ')} />
                            </div> : null }
                            
                            <div className="card-swatch-container">
                              <div className="card-swatch">
                                <div style={ pickerStyles.swatch } name='NHEJ' onClick={(e)=>{this.handleClick(e,'NHEJ')} }>
                                  <div style={ NHEJStyles } />
                                </div>
                              </div>
                              <div className="card-swatch-label">
                                NHEJ
                              </div>
                            </div>
                            { this.state.displayColorPickers.NHEJ ? <div style={ pickerStyles.popover }>
                              <div style={ pickerStyles.cover } name='NHEJ' onClick={(e)=>this.handleClose(e,'NHEJ')}/>
                              <SketchPicker color={ this.state.colors.NHEJ } name='NHEJ' onChangeComplete={(c)=>this.handleChange(c,'NHEJ')} />
                            </div> : null }
                            
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </CardBody>
                </Card>

              </div>
            </div>
            <div className="App-pane App-rightPane">
              <IndelRelativeFrequencyViewer
                indels={this.state.indelsAsObj}
                viewerHeight={this.state.viewerHeight}
                viewerWidth={this.state.viewerWidth}
                viewerBorderWidth={this.state.viewerBorderWidth}
                dataColors={this.state.colors} />
            </div>
          </SplitPane>
        </div>
      </div>
    );
  }  
}

export default App;
