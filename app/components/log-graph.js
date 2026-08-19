import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';

const MIN_TIMELINE_WIDTH = 640;
const GRID_INTERVAL_MS = 300000;
const COOLDOWN_GROUP_PIXELS = 8;
let nextGraphId = 0;

export default class LogGraphComponent extends Component {
  @tracked graphPixelWidth = 0;

  graphElementId = `log-graph-${nextGraphId += 1}`;

  constructor() {
    super(...arguments);

    this.measureGraphWidthOnNextFrame();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.measureGraphWidth);
    }
  }

  willDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.measureGraphWidth);

      if (this.measureAnimationFrame) {
        window.cancelAnimationFrame(this.measureAnimationFrame);
      }
    }

    super.willDestroy(...arguments);
  }

  get startOffset() {
    return this.args.startOffset || 0;
  }

  get reportUrl() {
    return `https://classic.warcraftlogs.com/reports/${this.args.key}`;
  }

  get timelineLength() {
    return this.args.maxRaidLength || 0;
  }

  get minimumTimelineWidth() {
    return Math.max(this.timelineLength / this.args.msPerPixel, MIN_TIMELINE_WIDTH);
  }

  get measuredTimelineWidth() {
    return this.graphPixelWidth || this.minimumTimelineWidth;
  }

  get timelineStyle() {
    let gridIntervalWidth = this.timelineLength > 0 ? (GRID_INTERVAL_MS / this.timelineLength) * 100 : 100;

    return htmlSafe(`--timeline-tick-width: ${gridIntervalWidth}%; width: ${this.minimumTimelineWidth}px;`);
  }

  get cooldownGroups() {
    if (this.timelineLength <= 0) {
      return [];
    }

    let groupedCooldowns = (this.args.cooldowns || []).slice().sort((firstCooldown, secondCooldown) => {
      return firstCooldown.offset - secondCooldown.offset;
    }).reduce((groups, cooldown) => {
      let pixelOffset = (cooldown.offset / this.timelineLength) * this.measuredTimelineWidth;
      let currentGroup = groups[groups.length - 1];

      if (!currentGroup || pixelOffset - currentGroup.firstPixelOffset > COOLDOWN_GROUP_PIXELS) {
        groups.push({
          firstPixelOffset: pixelOffset,
          cooldowns: []
        });

        currentGroup = groups[groups.length - 1];
      }

      currentGroup.cooldowns.push(cooldown);

      return groups;
    }, []);

    return groupedCooldowns.map((group) => {
      let cooldowns = group.cooldowns.sort((firstCooldown, secondCooldown) => {
        return firstCooldown.offset - secondCooldown.offset;
      });
      let firstCooldown = cooldowns[0];
      let lastCooldown = cooldowns[cooldowns.length - 1];
      let offset = cooldowns.reduce((totalOffset, cooldown) => {
        return totalOffset + cooldown.offset;
      }, 0) / cooldowns.length;

      return {
        offset,
        cooldowns,
        count: cooldowns.length,
        formattedTime: this.formatCooldownGroupTime(firstCooldown, lastCooldown)
      };
    }).sort((firstGroup, secondGroup) => {
      return firstGroup.offset - secondGroup.offset;
    });
  }

  formatCooldownGroupTime(firstCooldown, lastCooldown) {
    if (firstCooldown.formattedTime === lastCooldown.formattedTime) {
      return firstCooldown.formattedTime;
    }

    return `${firstCooldown.formattedTime} - ${lastCooldown.formattedTime}`;
  }

  @action
  measureGraphWidth() {
    if (typeof document === 'undefined') {
      return;
    }

    let graphElement = document.getElementById(this.graphElementId);

    if (!graphElement) {
      return;
    }

    let graphWidth = graphElement.getBoundingClientRect().width;

    if (Number.isFinite(graphWidth) && graphWidth > 0 && Math.abs(this.graphPixelWidth - graphWidth) > 0.5) {
      this.graphPixelWidth = graphWidth;
    }
  }

  measureGraphWidthOnNextFrame() {
    if (typeof window === 'undefined') {
      return;
    }

    this.measureAnimationFrame = window.requestAnimationFrame(this.measureGraphWidth);
  }

  @action
  setStartOffset(startOffset) {
    this.args.setStartOffset(startOffset);
  }

  @action
  commitRunName(event) {
    this.args.setRunName(event.target.value);
  }

  @action
  handleRunNameKeydown(event) {
    if (event.key === 'Enter') {
      event.target.blur();
    }
  }

  @action
  resetOffset() {
    this.args.setStartOffset(0);
  }
}
