import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';

const MIN_TIMELINE_WIDTH = 640;
const GRID_INTERVAL_MS = 300000;

export default class LogGraphComponent extends Component {
  get startOffset() {
    return this.args.startOffset || 0;
  }

  get timelineStyle() {
    let timelineLength = this.args.maxRaidLength || 0;
    let timelineWidth = Math.max(timelineLength / this.args.msPerPixel, MIN_TIMELINE_WIDTH);
    let gridIntervalWidth = GRID_INTERVAL_MS / this.args.msPerPixel;

    return htmlSafe(`--timeline-tick-width: ${gridIntervalWidth}px; width: ${timelineWidth}px;`);
  }

  @action
  setStartOffset(startOffset) {
    this.args.setStartOffset(startOffset);
  }

  @action
  resetOffset() {
    this.args.setStartOffset(0);
  }
}
