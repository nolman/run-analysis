import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { compact, concat, max, min, uniq, values, without } from 'lodash';

const OFFSET_SEPARATOR = '~';
const OFFSET_PAIR_SEPARATOR = ':';

export default class LandingController extends Controller {
  queryParams = ['logids', 'offsets'];
  @tracked newLogId = '';
  @tracked logids = '';
  @tracked offsets = '';
  @tracked msPerPixel = 5000;

  get runs() {
    return values(this.model || {});
  }

  get runCount() {
    return this.runs.length;
  }

  get runCountLabel() {
    return `${this.runCount} ${this.runCount === 1 ? 'run' : 'runs'} loaded`;
  }

  get hasRuns() {
    return this.runCount > 0;
  }

  get raidDurations() {
    let startOffsets = this.startOffsets;

    return Object.keys(this.model || {}).map((logId) => {
      return this.runDuration(this.model[logId].data, startOffsets[logId] || 0);
    }).filter((duration) => {
      return Number.isFinite(duration);
    });
  }

  get maxRaidLength() {
    return max(this.raidDurations) || 0;
  }

  get fastestRaidLength() {
    return min(this.raidDurations) || 0;
  }

  get slowestRaidLength() {
    return max(this.raidDurations) || 0;
  }

  get raidSpread() {
    return this.slowestRaidLength - this.fastestRaidLength;
  }

  get formattedFastestRaidLength() {
    return this.formatDuration(this.fastestRaidLength);
  }

  get formattedSlowestRaidLength() {
    return this.formatDuration(this.slowestRaidLength);
  }

  get formattedRaidSpread() {
    return this.formatDuration(this.raidSpread);
  }

  get startOffsets() {
    return compact((this.offsets || '').split(OFFSET_SEPARATOR)).reduce((startOffsets, pair) => {
      let [logId, startOffset] = pair.split(OFFSET_PAIR_SEPARATOR);
      let parsedStartOffset = Number(startOffset);

      if (logId && Number.isFinite(parsedStartOffset) && parsedStartOffset > 0) {
        startOffsets[logId] = parsedStartOffset;
      }

      return startOffsets;
    }, {});
  }

  serializeStartOffsets(startOffsets) {
    return Object.keys(startOffsets).map((logId) => {
      return `${logId}${OFFSET_PAIR_SEPARATOR}${startOffsets[logId]}`;
    }).join(OFFSET_SEPARATOR);
  }

  runDuration(run, startOffset = 0) {
    return max((run.fights || []).filter((fight) => {
      return fight.end_time > startOffset;
    }).map((fight) => {
      return fight.end_time - startOffset;
    })) || 0;
  }

  formatDuration(milliseconds) {
    let totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
  }

  @action
  addLog(e) {
    e.preventDefault();
    let logId = this.newLogId.trim();

    if (!logId) {
      return;
    }

    let existingIds = compact(this.logids.split('~'));
    let newLogsIds = uniq(concat(existingIds, logId));
    this.logids = newLogsIds.join('~');
    this.newLogId = '';
  }

  @action
  removeLog(logId) {
    let existingIds = compact(this.logids.split('~'));
    let newLogsIds = without(existingIds, logId);
    this.logids = newLogsIds.join('~');
    this.setStartOffset(logId, 0);
  }

  @action
  setStartOffset(logId, startOffset) {
    let startOffsets = {
      ...this.startOffsets
    };

    if (startOffset > 0) {
      startOffsets[logId] = startOffset;
    } else {
      delete startOffsets[logId];
    }

    this.offsets = this.serializeStartOffsets(startOffsets);
  }
}
