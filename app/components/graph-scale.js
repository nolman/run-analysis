import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { times } from 'lodash';

const MIN_TIMELINE_WIDTH = 640;
const GRID_INTERVAL_MS = 300000;

export default class GraphScaleComponent extends Component {
  get intervals() {
    let raidSeconds = this.args.maxLength / 1000;
    let maxFiveMinInterval = Math.ceil(raidSeconds/300);
    return times(maxFiveMinInterval, (i) => { return i * 300 });
  }

  get axisStyle() {
    let axisWidth = Math.max(this.args.maxLength / this.args.msPerPixel, MIN_TIMELINE_WIDTH);
    let gridIntervalWidth = this.args.maxLength > 0 ? (GRID_INTERVAL_MS / this.args.maxLength) * 100 : 100;

    return htmlSafe(`--timeline-tick-width: ${gridIntervalWidth}%; width: ${axisWidth}px;`);
  }
}
