import React from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import './IndelRelativeFrequencyViewer.css';
import * as Constants from './Constants.js';

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

class IndelRelativeFrequencyViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      indels :                     this.props.indels || null,
      indelSubset :                null,
      indelSortIsAscending :       false,
      viewerTitle :                "",
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
      xAxisLabel :                 "No x-axis label",
      dataColors:                  {
        'NHEJ' : { r:  '68', g:   '1', b:  '84', a: '1' },
        'MMEJ' : { r: '253', g: '231', b:  '37', a: '1' },
      },
      svgWidth : 0,
      svgHeight : 0,
      openSvgWidth: 0,
      openSvgHeight: 0,
      svgViewbox : "0 0 0 0"
    };
    this.irfPlotContainer = React.createRef();
    this.containerTitle = React.createRef();
    this.svgNode = React.createRef();
    this.renderPlot = _.debounce(this.renderPlot, Constants.settings.timers.plotRefresh);
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log("componentDidUpdate");
    let containerWidth = parseInt(this.props.viewerWidth) - (this.state.containerMargin.left + this.state.containerMargin.right + this.state.containerPadding.left + this.state.containerPadding.right) + "px";
    let containerHeight = parseInt(this.props.viewerHeight) - (this.state.containerMargin.top + this.state.containerMargin.bottom + this.state.containerPadding.top + this.state.containerPadding.bottom) + "px";
    let svgWidth = containerWidth;
    let svgHeight = parseInt(containerHeight) - parseInt(this.containerTitle.current.clientHeight) + "px";
    // do not update dimensions if the browser is not being resized
    if ((containerWidth === prevState.containerWidth) && (containerHeight === prevState.containerHeight) && (this.props.indelsSelectedAmplicon === prevProps.indelsSelectedAmplicon)) return;
    // do not update if the component has not received any data
    if (Object.keys(this.props.indels).length === 0 && this.props.indels.constructor === Object) return;
    let filteredIndels = this.filterIndels(this.props.indelsSelectedAmplicon);
    let sortedFilteredIndels = this.sortFilteredIndels(filteredIndels, 'relative_frequency', this.state.indelSortIsAscending).slice(0, 60);
    this.setState({
      indelSubset: sortedFilteredIndels,
      containerWidth: containerWidth,
      containerHeight: containerHeight,
      svgWidth: svgWidth,
      svgHeight: svgHeight,
      openSvgWidth: svgWidth,
      openSvgHeight: svgHeight
    }, () => {
      // update if SVG viewport dimensions make sense
      if ((parseInt(svgWidth) > 0) && (parseInt(svgHeight) > 0)) { 
        this.renderPlot(); 
      }
    });
  }
  
  filterIndels = (indelType) => {
    return this.state.indels.alignments.filter((alignment) => alignment.line_type === indelType);
  }
  
  sortFilteredIndels = (indels, prop, isAscending) => {
    return indels.sort((a, b) => { return (a[prop] < b[prop]) ? ((isAscending) ? -1 : 1) : (a[prop] > b[prop]) ? ((isAscending) ? -1 : 1) : 0; });
  }
  
  renderPlot() {
    console.log("renderPlot()");
    
    let self = this;
    const node = this.svgNode;

    let svg = d3.select(node);
    
    // clear plot
    let svgSelectAll = svg.selectAll('*').remove();
    
    // specify font attributes
    let sequenceFontSize = Constants.settings.style.fontSize.sequenceGenericText.medium;
    let sequenceFontFamily = Constants.settings.style.fontFamily.sequenceGenericText;
    
    //
    // view width may be wider than viewport, so we first need to do some calculations
    //
    // -- we use a placeholder letter to get the width of a "letterElement"
    // -- a "letterElement" is a single letter from an amplicon or a read 
    // -- it has its own event handlers assigned to it, depending on what type of base it is (insertion, deletion, end-join type, etc. can change behavior)
    // -- from the width of this placeholder, we can then use the maximum-spanning read or amplicon length, whichever is greater, to determine how much horizontal space we need inside the viewport
    // -- CIGAR string attributes of reads will ultimately determine widest overall read length (for now, we stick with amplicons)
    //
    
    let root = svg.append('g').attr('id', 'irf-root');
    
    //
    // defs: patterns, etc.
    //
    
    let defs = root.append('defs');
    
    // ref. https://bl.ocks.org/jfsiii/7772281
    let patternStripe = defs.append('pattern')
      .attr('id', 'irf-pattern-generic-stripe')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(36)')
      .attr('width', 4)
      .attr('height', 4);
    patternStripe.append('rect')
      .attr('width', 2)
      .attr('height', 4)
      .attr('transform', 'translate(0,0)')
      .style('fill', 'white');
    let maskStripe = defs.append('mask')
      .attr('id', 'irf-mask-generic-stripe');
    maskStripe.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', '100%')
      .style('fill', 'url(#irf-pattern-generic-stripe)');
    
    //
    // sequences: contains the header and the reads
    //
    
    let sequences = root.append('g').attr('id', 'irf-sequences');
    
    let header = sequences.append('g').attr('id', 'irf-header');
    
    let ampliconName = this.props.indelsSelectedAmplicon;
    let amplicon = this.state.indels.amplicons[ampliconName].sequence;
    
    let placeholderCellItem = 'Z';    
    let placeholder = header.append('g').attr('class', 'placeholder');
    
    let cell = placeholder.selectAll('g')
      .data(placeholderCellItem)
      .enter()
      .append('g')
      .attr('id', 'irf-placeholder-head')
      .attr('class', 'placeholder-cell');

    cell.selectAll('text')
      .data(placeholderCellItem)
      .enter()
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', Constants.settings.style.color.sequenceGenericTextFill)
      .attr('font-size', sequenceFontSize)
      .attr('font-family', sequenceFontFamily)
      .attr('text-anchor', 'middle')
      .text((d, i) => d);
    
    // get bounding box of text field and store it in textBbs array
    let textBbs = [];
    cell.selectAll('text').each(function(d, i) {
      textBbs[i] = this.getBBox(); 
    });
      
    cell.selectAll('rect')
      .data(placeholderCellItem)
      .enter()
      .append('rect')
      .attr('class', 'cell-background')
      .style('fill', Constants.settings.style.color.sequenceCellRectFill)
      .style('fill-opacity', Constants.settings.style.opacity.sequenceCellRectOpacity)
      .style('stroke', Constants.settings.style.color.sequenceCellRectStroke)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', (d, i) => { return textBbs[i].width + Constants.settings.style.padding.sequenceGenericText.x*2 })
      .attr('height', (d, i) => { return textBbs[i].height + Constants.settings.style.padding.sequenceGenericText.y*2 });
      
    // clear out placeholder text
    cell.selectAll('text').remove();
      
    cell.selectAll('text')
      .data(placeholderCellItem)
      .enter()
      .append('text')
      .attr('class', 'cell-text')
      .attr('x', Constants.settings.style.padding.sequenceGenericText.x)
      .attr('y', (d, i) => { return 0 + textBbs[i].height - Constants.settings.style.padding.sequenceGenericText.y })
      .attr('fill', Constants.settings.style.color.sequenceGenericTextFill)
      .attr('font-size', sequenceFontSize)
      .attr('font-family', sequenceFontFamily)
      .attr('text-anchor', 'left')
      .text((d, i) => d);
    
    //
    // the content of cellBbs is the bounding box that surrounds the residue/base/nucleotide
    // we can use these dimensions to construct longer strings, into reads or amplicons, etc.
    // we can also use this for positioning elements everywhere in units of cells
    // as they are so valuable, we const them so that we can't accidently clobber them
    //
    let cellBbs = [];
    cell.selectAll('.cell-background').each(function(d, i) {
      cellBbs[i] = this.getBBox(); 
    });
    const cellWidth = cellBbs[0].width;
    const cellHeight = cellBbs[0].height;
    
    for (var idx = 0; idx < amplicon.length; idx++) {
      let x = idx * cellWidth;
      d3.select('.placeholder-cell').clone(true)
        .attr('id', `irf-amplicon-cell-${idx}`)
        .attr('class', 'amplicon-cell cell')
        .attr('transform', `translate(${x}, 0)`)
        .select('.cell-text')
        .text(amplicon[idx]);
    }
    
    d3.select('#irf-placeholder-head').remove();
    d3.select('.placeholder')
      .attr('id', `irf-amplicon-${ampliconName}`)
      .attr('class', 'amplicon-cells cells');
    
    //
    // to the header, we add another track which is positioned above the amplicon track
    // this upper track labels the first, last, and nth positions
    // we will make this twice the height of the amplicon cell height
    //
    const markerWidth = cellWidth;
    const markerHeight = 2 * cellHeight;
    const ampliconVerticalShift = 1.01 * markerHeight;
    d3.select(`#irf-amplicon-${ampliconName}`)
      .attr('transform', `translate(0, ${ampliconVerticalShift})`);
    
    let markers = header.append('g')
      .attr('id', 'irf-markers')
      .attr('class', 'marker-cells cells');
    let markerValues = new Array(amplicon.length - 1);
    for (let idx = 1; idx <= amplicon.length; idx++) {
      markerValues[idx] = ((idx === 1) || (idx === amplicon.length) || ((idx % Constants.settings.style.step.marker) === 0)) ? idx : NaN;
    }
    markerValues = markerValues.slice(1, amplicon.length + 1);
    
    markers.selectAll('g')
      .data(markerValues)
      .enter()
      .append('g')
      .attr('id', (d, i) => { return `irf-marker-cell-${i}`; })
      .attr('class', 'marker-cell');
    
    for (let idx = 0; idx < amplicon.length; idx++) {
      let markerCellId = `#irf-marker-cell-${idx}`;
      d3.select(markerCellId)
        .append('rect')
        .attr('id', `irf-marker-background-${idx}`)
        .attr('class', 'marker-background')
        .style('fill', Constants.settings.style.color.markerCellRectFill)
        .style('fill-opacity', Constants.settings.style.opacity.markerCellRectOpacity)
        .attr('x', idx * markerWidth)
        .attr('y', 0)
        .attr('height', markerHeight)
        .attr('width', markerWidth);
      d3.select(markerCellId)
        .append('text')
        .attr('id', `irf-marker-text-${idx}`)
        .attr('class', 'marker-text')
        .attr('fill', Constants.settings.style.color.markerGenericTextFill)
        .attr('font-size', Constants.settings.style.fontSize.markerGenericText.medium)
        .attr('font-family', Constants.settings.style.fontFamily.markerGenericText)
        .attr('font-weight', Constants.settings.style.fontWeight.markerGenericText)
        .attr('text-anchor', 'start')
        .attr('transform', 'rotate(270) translate(' + (-markerHeight + Constants.settings.style.padding.marker.vertical) + ' ' + ((idx * markerWidth) + (markerWidth / 2) + Constants.settings.style.padding.marker.horizontal) + ')')
        .text(Number.isNaN(markerValues[idx]) ? "" : markerValues[idx]);
    }
    
    const headerBBox = sequences.select('#irf-header').node().getBBox();
    const headerWidth = headerBBox.width;
    const headerHeight = headerBBox.height;
    
    //
    // construct reads sequences <g> grouping from indel subset array
    // note that we must be careful to parse the CIGAR string in such a way that cells are indexed by their alignment to the ** amplicon **
    // this will ensure that we can apply events with a consistent naming scheme, when mousing over amplicon cells
    //
    let reads = sequences.append('g')
      .attr('id', 'irf-reads')
      .attr('transform', `translate(0 ${headerHeight})`);
    
    let startingReadIdx = 0;
    let renderedReadIdx = 0;
    for (let readIdx = startingReadIdx; readIdx < this.state.indelSubset.length; ++readIdx, ++renderedReadIdx) {
      let indel = this.state.indelSubset[readIdx];
      //console.log("indel", indel);
      const cigar = indel.cigar;
      const cigarValues = cigar.split(/[H|M|D|I]/).filter(d => d !== "").map(d => parseInt(d));
      const cigarOperations = cigar.split(/[^H|M|D|I]/).filter(d => d !== "");
      let cigarOps = [];
      cigarOperations.forEach((k, i) => { let op = {}; op[k] = cigarValues[i]; cigarOps.push(op); })
      //console.log("ops", cigarOps);
      // construct read
      let readWidthOffset = 0;
      let read = reads.append('g')
        .attr('id', `irf-read-${readIdx}`)
        .attr('class', 'read-cells cells');
      const readSequence = indel.read;
      let readPositionOffset = 0;
      let matchBlocksLength = 0;
      let insertionBlockIdx = 0;
      let insertionBlocksLength = 0;
      let deletionBlockIdx = 0;
      let deletionBlocksLength = 0;
      let offsetCorrection = 0;
      let firstMatchBlockResidues = [];
      let isFirstMatchResidueTracked = true;
      for (let cigarOpIdx = 0; cigarOpIdx < cigarOps.length; ++cigarOpIdx) {
        for (let [opKey, opValue] of Object.entries(cigarOps[cigarOpIdx])) {
          //
          // generic read cell
          //
          //console.log("opKey, opValue", opKey, opValue);
          //console.log("readPositionOffset, readPositionOffset+opValue", readPositionOffset, readPositionOffset+opValue)
          let subreadSequence = readSequence.slice(readPositionOffset, readPositionOffset+opValue);
          //console.log("subreadSequence", subreadSequence);
          let residues = subreadSequence.split('');
          //console.log("residues", residues);
          //console.log("residues.length", residues.length);
          
          let readBlock = read.append('g')
            .attr('id', `irf-read-${readIdx}-block-${cigarOpIdx}`)
            .attr('class', `read-block read-block-${opKey}`);

          // 
          // initialize block-specific state parameters
          //            
          switch (opKey) {
            case 'I':
              var insertionBlockResidues = []; 
              var insertionBlockXOffset = 0;
              var insertionBlockWidth = cellWidth / 6.0;
              break;
            case 'D':
              var deletionBlockXOffset = 0;
              break;
            case 'M':
            case 'H':
            default:
              break;
          }
          
          let startPosIdx = readPositionOffset;
          let endPosIdx = readPositionOffset + opValue;
          for (; startPosIdx < endPosIdx; ++startPosIdx) {
            let residue = residues[startPosIdx - readPositionOffset];
            //console.log(startPosIdx, residue);
            let readCellId = `irf-read-${readIdx}-cell-${startPosIdx}`;
            //
            // the x-offset of rect/text elements is dependent on H|M|D blocks and should leave out I-blocks (insertion)
            //
            let xOffset = parseFloat(startPosIdx - insertionBlocksLength + deletionBlocksLength) * cellWidth;
            let xTextPosition = xOffset + Constants.settings.style.padding.sequenceGenericText.x;
            let yTextPosition = textBbs[0].height - Constants.settings.style.padding.sequenceGenericText.y;
            //
            // apply per-op specific style, fill, etc. attributes and content
            //
            switch (opKey) {

              //
              // hard-clip block
              //
              case 'H':
                readBlock.append('g')
                  .attr('id', readCellId)
                  .attr('class', `read-cell read-${opKey}-cell read-${residue}-base`)
                  .attr('data-original-rect-fill', Constants.settings.style.color.hardclipCellRectFill)
                  .attr('data-original-rect-stroke', Constants.settings.style.color.hardclipCellRectStroke)
                readBlock.select(`#${readCellId}`)
                  .append('rect')
                  .attr('id', `irf-read-${readIdx}-block-${cigarOpIdx}-cell-${startPosIdx}-background`)
                  .attr('class', `read-block-cell-background read-block-${opKey}-cell-background cell-background`)
                  .style('fill', Constants.settings.style.color.hardclipCellRectFill)
                  .style('fill-opacity', Constants.settings.style.opacity.hardclipCellRectFillOpacity)
                  .style('stroke', Constants.settings.style.color.hardclipCellRectStroke)
                  .attr('height', cellHeight)
                  .attr('width', cellWidth)
                  .attr('transform', `translate(${xOffset} 0)`);
                readBlock.select(`#${readCellId}`)
                  .append('text')
                  .attr('id', `irf-read-${readIdx}-block-${cigarOpIdx}-cell-${startPosIdx}-text`)
                  .attr('class', `read-block-cell-text read-block-${opKey}-cell-text cell-text`)
                  .attr('fill', Constants.settings.style.color.sequenceGenericTextFill)
                  .attr('font-size', sequenceFontSize)
                  .attr('font-family', sequenceFontFamily)
                  .attr('text-anchor', 'start')
                  .attr('transform', `translate(${xTextPosition} ${yTextPosition})`)
                  .text(residue);
                break;
                
              //
              // match block
              //
              case 'M':
                readBlock.append('g')
                  .attr('id', readCellId)
                  .attr('class', `read-cell read-${opKey}-cell read-${residue}-base`);
                readBlock.select(`#${readCellId}`)
                  .append('rect')
                  .attr('id', `irf-read-${readIdx}-block-${cigarOpIdx}-cell-${startPosIdx}-background`)
                  .attr('class', `read-block-cell-background read-block-${opKey}-cell-background cell-background`)
                  .style('fill', Constants.settings.style.color.matchCellRectFill)
                  .style('fill-opacity', Constants.settings.style.opacity.matchCellRectFillOpacity)
                  .style('stroke', Constants.settings.style.color.matchCellRectStroke)
                  .attr('height', cellHeight)
                  .attr('width', cellWidth)
                  .attr('transform', `translate(${xOffset} 0)`);
                readBlock.select(`#${readCellId}`)
                  .append('text')
                  .attr('id', `irf-read-${readIdx}-block-${cigarOpIdx}-cell-${startPosIdx}-text`)
                  .attr('class', `read-block-cell-text read-block-${opKey}-cell-text cell-text`)
                  .attr('fill', Constants.settings.style.color.sequenceGenericTextFill)
                  .attr('font-size', sequenceFontSize)
                  .attr('font-family', sequenceFontFamily)
                  .attr('text-anchor', 'start')
                  .attr('transform', `translate(${xTextPosition} ${yTextPosition})`)
                  .text(residue);
                matchBlocksLength += 1;
                firstMatchBlockResidues.push(residue);
                break;
              
              // 
              // deletion block
              //
              case 'D':
                if (startPosIdx === readPositionOffset) {
                  deletionBlockXOffset = xOffset;
                }
                deletionBlocksLength += 1;
                readPositionOffset -= 1;
                break;
              
              // 
              // insertion block
              //
              case 'I':
                insertionBlockXOffset = xOffset - (insertionBlockWidth / 2.0);
                insertionBlockResidues.push(residue);
                insertionBlocksLength += 1;
                break;
                
              default:
                throw new Error('Unknown CIGAR operand');
            }
          }
          //
          // flip first-match-block tracker
          //
          if (opKey === 'M') isFirstMatchResidueTracked = false;
          
          //
          // add insertion block, upon completion
          //
          if ((opKey === 'I') && (startPosIdx === endPosIdx)) {
            let insertionBlockId = `irf-read-${readIdx}-insertion-${insertionBlockIdx}`;
            readBlock.append('g')
              .attr('id', insertionBlockId)
              .attr('class', `read-insertion-block`)
              .attr('data-insertion-residues', insertionBlockResidues.join(''))
              .attr('data-original-rect-fill', Constants.settings.style.color.insertionCellRectFill)
              .attr('data-original-rect-fill-opacity', Constants.settings.style.opacity.insertionCellRectFillOpacity)
              .attr('data-original-rect-stroke', Constants.settings.style.color.insertionCellRectStroke);
            readBlock.select(`#${insertionBlockId}`)
              .append('rect')
              .attr('id', `irf-read-${readIdx}-block-${cigarOpIdx}-insertion-${insertionBlockIdx}-background`)
              .attr('class', `read-block-cell-background read-block-${opKey}-cell-background cell-background`)
              .style('fill', Constants.settings.style.color.insertionCellRectFill)
              .style('fill-opacity', Constants.settings.style.opacity.insertionCellRectFillOpacity)
              .style('stroke', Constants.settings.style.color.insertionCellRectStroke)
              .attr('height', cellHeight)
              .attr('width', insertionBlockWidth)
              .attr('transform', `translate(${insertionBlockXOffset} 0)`);
            insertionBlockIdx += 1;
          }
          
          //
          // add deletion block, upon completion
          //
          if ((opKey === 'D') && (startPosIdx === endPosIdx)) {
            let deletionBlockWidth = opValue * cellWidth;
            let deletionBlockId = `irf-read-${readIdx}-deletion-${deletionBlockIdx}`;
            readBlock.append('g')
              .attr('id', deletionBlockId)
              .attr('class', `read-cell read-${opKey}-cell read-deletion-block`)
              .attr('data-deletion-length', opValue)
              .attr('data-original-rect-fill', Constants.settings.style.color.deletionCellRectFill)
              .attr('data-original-rect-fill-opacity', Constants.settings.style.opacity.deletionCellRectFillOpacity)
              .attr('data-original-rect-stroke', Constants.settings.style.color.deletionCellRectStroke);
            readBlock.select(`#${deletionBlockId}`)
              .append('rect')
              .attr('id', `irf-read-${readIdx}-block-${cigarOpIdx}-deletion-${deletionBlockIdx}-background`)
              .attr('class', `read-block-cell-background read-block-${opKey}-cell-background cell-background`)
              .attr('mask', 'url(#irf-mask-generic-stripe)')
              .style('fill', Constants.settings.style.color.deletionCellRectFill)
              .style('fill-opacity', Constants.settings.style.opacity.deletionCellRectFillOpacity)
              .style('stroke', Constants.settings.style.color.deletionCellRectStroke)
              .attr('height', cellHeight)
              .attr('width', deletionBlockWidth)
              .attr('transform', `translate(${deletionBlockXOffset} 0)`);
            deletionBlockIdx += 1;
          }
          
          //
          // increment read position offset
          //
          readPositionOffset += opValue;
          
          //
          // apply translate transform on read based on width of leading hardclips
          // and any difference in length between amplicon and read 
          //
          // if the read is shorter, then we may need to offset backwards at the conclusion of the read, depending on offset of first match block
          //
          let readHeightOffset = renderedReadIdx * cellHeight;
          if ((cigarOpIdx === 0) && (opKey === "H")) {
            readWidthOffset += -1 * opValue * cellWidth;
          } 
          else if ((cigarOpIdx === (cigarOps.length - 1)) && (opKey === "H")) {
            //
            // check if the read needs shifting to the right -- this is terribly hacky; maybe check with Jemma 
            // to see if we can do this differently on the pipeline side -- an offset value with the CIGAR would
            // perhaps be useful
            //
            offsetCorrection = amplicon.indexOf(firstMatchBlockResidues.join(''));
            offsetCorrection = (offsetCorrection > 0) ? offsetCorrection : 0;
            if (((amplicon.length - matchBlocksLength) > 0) && (offsetCorrection > 0)) {
              //console.log(amplicon, firstMatchResidues.join(''), amplicon.indexOf(firstMatchResidues.join('')));
              readWidthOffset += offsetCorrection * cellWidth;
            }
            else if ((amplicon.length - matchBlocksLength) < 0) {
              throw new Error('CIGAR M (match) blocks have a longer total length than the amplicon');
            }
            read.attr('transform', `translate(${readWidthOffset} ${readHeightOffset})`);
          }
        }
      }
      
      //
      // re-ordering the vertical "depth" of blocks helps to ensure
      // that insertion and deletion blocks are visible 
      //
      // hard-clip blocks get lowest priority
      //
      
      //
      // bring all match blocks to the foreground of the read
      //
      read.selectAll('.read-block-M').moveToFront();
      
      //
      // bring all insertion blocks to the foreground
      //
      read.selectAll('.read-block-I').moveToFront();
      
      //
      // bring all deletion blocks to the foreground
      //
      read.selectAll('.read-block-D').moveToFront();
      
      //
      // reparse alignment blocks to label residues by position index
      //
      let realignmentReadPositionOffset = 0;
      let matchAlignmentIdx = offsetCorrection;
      for (let cigarOpIdx = 0; cigarOpIdx < cigarOps.length; ++cigarOpIdx) {
        for (let [opKey, opValue] of Object.entries(cigarOps[cigarOpIdx])) {
          let endPosIdx = realignmentReadPositionOffset + opValue;
          for (let startPosIdx = realignmentReadPositionOffset; startPosIdx < endPosIdx; ++startPosIdx) {
            let readCellId = `#irf-read-${readIdx}-cell-${startPosIdx}`;
            switch (opKey) {
              case 'H':
                break;
              case 'M':
                d3.select(readCellId)
                  .each(function(d, i) {
                    let matchCell = d3.select(this);
                    let existingClasses = matchCell.attr('class');
                    let alignmentClass = `cell-match-alignment-${matchAlignmentIdx}`;
                    matchCell.attr('class', `${existingClasses} ${alignmentClass}`);
                    let matchCellRect = matchCell.select('rect');
                    let matchCellText = matchCell.select('text');
                    let matchCellResidue = matchCellText.text();
                    let alternateResidue = matchCellResidue;
                    let referenceResidue = amplicon[matchAlignmentIdx];
                    if (alternateResidue !== referenceResidue) {
                      let substitutionClass = 'cell-match-substitution';
                      matchCell.attr('class', `${existingClasses} ${alignmentClass} ${substitutionClass}`);
                      matchCell.attr('data-substitution-alternate', alternateResidue);
                      matchCell.attr('data-substitution-reference', referenceResidue);
                      matchCellRect.attr('mask', 'url(#irf-mask-generic-stripe)')
                      matchCellRect.style('fill', Constants.settings.style.color.sequenceSubstitutionCellRectFill);
                      matchCellText.style('fill', Constants.settings.style.color.sequenceSubstitutionTextFill);
                    }
                    // add these "original" data attributes so that the fill/stroke/etc. can be repainted, if needed
                    matchCell.attr('data-original-rect-fill', matchCellRect.style('fill'));
                    matchCell.attr('data-original-rect-stroke', matchCellRect.style('stroke'));
                    matchAlignmentIdx++;
                  })
                break;
              case 'D':
                matchAlignmentIdx += 1;
                realignmentReadPositionOffset -= 1;
                break;
              case 'I':
                break;
              default:
                throw new Error('Unknown CIGAR operand');
            }
          }
          realignmentReadPositionOffset += opValue;
        }
      }
          
      //break;
    }
      
    // 
    // event handlers
    //
    
    //
    // amplicon cells
    //
    d3.selectAll('.amplicon-cell')
      .on('mouseenter', (d, i) => { 
        let adjustedIdx = amplicon.length - i - 1;
        let markerValue = amplicon.length - i;
        let ampliconCellId = `#irf-amplicon-cell-${adjustedIdx}`;
        let ampliconCell = d3.select(ampliconCellId);
        ampliconCell.select('.cell-background')
          .style('fill', Constants.settings.style.color.sequenceCellRectHighlightedFill)
          .style('stroke', Constants.settings.style.color.sequenceCellRectHighlightedStroke);
        let markerCellId = `#irf-marker-cell-${adjustedIdx}`;
        let markerCell = d3.select(markerCellId);
        markerCell.select('.marker-text')
          .attr('font-weight', Constants.settings.style.fontWeight.markerGenericTextHighlighted)
          .text(markerValue);
        let matchCellClass = `.cell-match-alignment-${adjustedIdx}`;
        let matchCell = d3.selectAll(matchCellClass);
        matchCell.select('.cell-background')
          .style('fill', Constants.settings.style.color.sequenceCellRectHighlightedFill)
          .style('stroke', Constants.settings.style.color.sequenceCellRectHighlightedStroke);
      })
      .on('mouseleave', (d, i) => { 
        let adjustedIdx = amplicon.length - i - 1;
        let ampliconCellId = `#irf-amplicon-cell-${adjustedIdx}`;
        let ampliconCell = d3.select(ampliconCellId);
        ampliconCell.select('.cell-background')
          .style('fill', Constants.settings.style.color.sequenceCellRectFill)
          .style('stroke', Constants.settings.style.color.sequenceCellRectStroke);
        let markerCellId = `#irf-marker-cell-${adjustedIdx}`;
        let markerCell = d3.select(markerCellId);
        markerCell.select('.marker-text')
          .attr('font-weight', Constants.settings.style.fontWeight.markerGenericText)
          .text(Number.isNaN(markerValues[adjustedIdx]) ? "" : markerValues[adjustedIdx]);
        let matchCellClass = `.cell-match-alignment-${adjustedIdx}`;
        let matchCell = d3.selectAll(matchCellClass)
          .each(function(d, i) {
            let matchCellElement = d3.select(this);
            matchCellElement.select('.cell-background')
              .style('fill', matchCellElement.attr('data-original-rect-fill'))
              .style('stroke', matchCellElement.attr('data-original-rect-stroke'));
          });
      });
    
    //
    // generic and substitution cells
    //
    const genericReadCellRegex = /irf-read-(?<read>[\d]+)-cell-(?<cell>[\d]+)/;
    
    function highlightRead(readIdx) {
      let readElementId = `#irf-read-${readIdx}`;
      let readElement = d3.select(readElementId);
      readElement.selectAll('.read-cell')
        .each(function(d, i) {
          let readCellElement = d3.select(this);
          if (!readCellElement.classed("read-H-cell") && !readCellElement.classed("read-D-cell")) {
            readCellElement.select('.cell-background')
              .style('fill', Constants.settings.style.color.sequenceCellRectHighlightedFill)
              .style('stroke', Constants.settings.style.color.sequenceCellRectHighlightedStroke);
          }
        });
    }
    
    function unHighlightRead(readIdx) {
      let readElementId = `#irf-read-${readIdx}`;
      let readElement = d3.select(readElementId);
      readElement.selectAll('.read-cell')
        .each(function(d, i) {
          let readCellElement = d3.select(this);
          if (!readCellElement.classed("read-H-cell") && !readCellElement.classed("read-D-cell")) {
            readCellElement.select('.cell-background')
              .style('fill', readCellElement.attr('data-original-rect-fill'))
              .style('stroke', readCellElement.attr('data-original-rect-stroke'));
          }
        });
    }
    
    d3.selectAll('.read-cell')
      .on('mouseenter', function(d, i) {
        let readCellElement = d3.select(this);
        let readCellElementId = readCellElement.attr('id');
        let readCellElementReadIdx = readCellElementId.match(genericReadCellRegex).groups.read;
        highlightRead(readCellElementReadIdx);
        if (readCellElement.classed("cell-match-substitution")) {
          let substitutionElementAlternateResidue = readCellElement.attr('data-substitution-alternate');
          let substitutionElementReferenceResidue = readCellElement.attr('data-substitution-reference');
          console.log("substitutionElementId (mouseenter)", readCellElementId, readCellElementReadIdx, substitutionElementAlternateResidue, substitutionElementReferenceResidue);
        }
        else {
          console.log("readCellElementId (mouseenter)", readCellElementId, readCellElementReadIdx)
        }
      })
      .on('mouseleave', function(d, i) {
        let readCellElement = d3.select(this);
        let readCellElementId = readCellElement.attr('id');
        let readCellElementReadIdx = readCellElementId.match(genericReadCellRegex).groups.read;
        unHighlightRead(readCellElementReadIdx);
        if (readCellElement.classed("cell-match-substitution")) {
          console.log("substitutionElementId (mouseleave)", readCellElementId);
        }
        else {
          console.log("readCellElementId (mouseleave)", readCellElementId);
        }
      });
    
    //
    // insertion blocks
    //
    const insertionReadCellRegex = /irf-read-(?<read>[\d]+)-insertion-(?<block>[\d]+)/;
    d3.selectAll('.read-insertion-block')
      .on('mouseenter', function(d, i) {
        let insertionBlockElement = d3.select(this);
        let insertionBlockElementId = insertionBlockElement.attr('id');
        let insertionBlockElementReadIdx = insertionBlockElementId.match(insertionReadCellRegex).groups.read;
        highlightRead(insertionBlockElementReadIdx);
        let insertionBlockElementResidues = insertionBlockElement.attr('data-insertion-residues');
        console.log("insertionBlockElementId (mouseenter)", insertionBlockElementId, insertionBlockElementReadIdx, insertionBlockElementResidues);
      })
      .on('mouseleave', function(d, i) {
        let insertionBlockElement = d3.select(this);
        let insertionBlockElementId = insertionBlockElement.attr('id');
        let insertionBlockElementReadIdx = insertionBlockElementId.match(insertionReadCellRegex).groups.read;
        unHighlightRead(insertionBlockElementReadIdx);
        console.log("insertionBlockElementId (mouseleave)", insertionBlockElementId);
      });
    
    //
    // we will ultimately want to attach contextual event handlers to this cell, depending on whether it is part of a read or an amplicon
    // the next step is to clone this cell group, as a "cell factory" which can be part of a larger "string-group"
    //
    const rootBBox = svg.select('#irf-root').node().getBBox();
    const rootWidth = rootBBox.width;
    const rootHeight = rootBBox.height;
    let openSvgWidth = rootWidth;
    let openSvgHeight = this.state.svgHeight;
    let svgViewboxWidth = parseInt(this.state.svgWidth);
    let svgViewboxHeight = parseInt(this.state.svgHeight);
    let svgViewbox = `0 0 ${svgViewboxWidth} ${svgViewboxHeight}`;
    //console.log("rootWidth, rootHeight", rootWidth, rootHeight);
    //console.log("svgViewbox", svgViewbox);
    this.setState({
      openSvgWidth: openSvgWidth,
      openSvgHeight: openSvgHeight,
      svgViewbox: svgViewbox
    });
    
    //
    // add zoom and pan lock attributes
    //
/*
    let x0 = 0;
    let y0 = 0;
    let x1 = rootWidth;
    let y1 = rootHeight;
*/
    let zoom = d3.zoom()
      .scaleExtent([0.33, 4])
      .on("zoom", () => {
        //root.style("stroke-width", 1.5 / d3.event.transform.k + "px");
        sequences.attr("transform", d3.event.transform); // updated for d3 v4
/*
          let t = d3.event.transform;
          if (t.invertY(0) > y0) t.y = -y0 * t.k;
          else if (t.invertY(rootHeight) < y1) t.y = rootHeight - y1 * t.k;
          root.attr("transform", t);
*/
      });
    svg.call(zoom);
    
    //
    // center the viewport on the midpoint of the internal svg container
    // this should be the same as half of the amplicon length x cell width
    // we correct this by shifting left by half of what cells are visible onscreen (i.e., within the viewport)
    //
/*
    let headerMidpoint = parseFloat(openSvgWidth) / 2.0;
    let visibleHeaderCellHalfWidth = svgViewboxWidth / 2.0;
    document.getElementById(this.props.indelsPlotId).scrollTo({
      top: 0,
      left: headerMidpoint - visibleHeaderCellHalfWidth,
      behavior: 'smooth'
    });
*/
    
    //
    // bring header to the foreground
    //
    sequences.selectAll('#irf-header').moveToFront();
  }

  render() {
    return (
      <div id="irf-container" style={{
        width: this.state.containerWidth,
        height: this.state.containerHeight,
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
        <div 
          id="irf-container-title" 
          className="irf-container-title" 
          ref={this.containerTitle} 
          style={{
            textAlign: this.props.viewerTitleTextAlign || this.state.viewerTitleTextAlign,
            fontSize: this.props.viewerTitleFontSize || this.state.viewerTitleFontSize,
            fontWeight: this.props.viewerTitleFontWeight || this.state.viewerTitleFontWeight,
            color: this.props.viewerTitleColor || this.state.viewerTitleColor,
          }}>
          {this.props.viewerTitle || this.props.indels.sample} | {this.props.indelsSelectedAmplicon}
        </div>
        <div className="irf-plot-container" ref={this.irfPlotContainer} id={this.props.indelsPlotId}>
        
          <svg className="irf-plot-svg"
            ref={(node) => {this.svgNode = node}} 
            shapeRendering="optimizeSpeed"
            preserveAspectRatio="xMinYMid meet"
            //preserveAspectRatio="xMidYMid slice"
            width={this.state.openSvgWidth} 
            height={this.state.openSvgHeight}
            viewBox={this.state.svgViewbox} 
          />
            
        </div>
      </div>
    );
  }
}

export default IndelRelativeFrequencyViewer;