import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';
import { compact, concat, max, min, sum, times, uniq, values, without } from 'lodash';
import { classColorFor } from 'run-analysis/utils/class-colors';
import { DPS_COOLDOWN_DEFINITIONS } from 'run-analysis/utils/dps-cooldowns';

const OFFSET_SEPARATOR = '~';
const OFFSET_PAIR_SEPARATOR = ':';

export default class LandingController extends Controller {
  queryParams = ['logids', 'offsets'];
  @tracked newLogId = '';
  @tracked logids = '';
  @tracked offsets = '';
  @tracked msPerPixel = 5000;
  @tracked showCooldowns = false;

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

  get summaryRuns() {
    let startOffsets = this.startOffsets;

    return Object.keys(this.model || {}).map((logId) => {
      let log = this.model[logId].data;
      let startOffset = startOffsets[logId] || 0;
      let fights = (log.fights || []).filter((fight) => {
        return fight.end_time > startOffset;
      }).sort((firstFight, secondFight) => {
        return firstFight.start_time - secondFight.start_time;
      });

      return {
        logId,
        title: log.title || logId,
        startOffset,
        fights,
        cooldowns: this.cooldownsForRun(this.model[logId].cooldowns || [], startOffset),
        bossFights: fights.filter((fight) => {
          return fight.boss !== 0;
        })
      };
    });
  }

  get hasBreakdownRows() {
    return this.breakdownRows.length > 0;
  }

  get hasCooldownRows() {
    return this.cooldownRows.length > 0;
  }

  get cooldownRows() {
    let cooldownKeys = uniq(this.summaryRuns.map((run) => {
      return run.cooldowns.map((cooldown) => {
        return cooldown.key;
      });
    }).flat()).sort((firstKey, secondKey) => {
      return this.cooldownSortIndex(firstKey) - this.cooldownSortIndex(secondKey);
    });

    return cooldownKeys.map((cooldownKey) => {
      let cooldown = this.cooldownDefinition(cooldownKey);

      return {
        key: cooldownKey,
        label: cooldown ? cooldown.name : this.cooldownLabel(cooldownKey),
        cells: this.summaryRuns.map((run) => {
          return this.cooldownCell(run.cooldowns.filter((runCooldown) => {
            return runCooldown.key === cooldownKey;
          }));
        })
      };
    });
  }

  get breakdownRows() {
    let maxBossCount = max(this.summaryRuns.map((run) => {
      return run.bossFights.length;
    })) || 0;

    return times(maxBossCount, (bossIndex) => {
      let bossLabel = this.bossLabelForIndex(bossIndex);

      return [
        this.buildBreakdownRow('trash', `Trash before ${bossLabel}`, bossIndex),
        this.buildBreakdownRow('gap', `Gaps before ${bossLabel}`, bossIndex),
        this.buildBreakdownRow('boss', bossLabel, bossIndex)
      ];
    }).flat().filter((row) => {
      return row.cells.some((cell) => {
        return !cell.missing && cell.duration > 0;
      });
    });
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

  bossLabelForIndex(bossIndex) {
    let run = this.summaryRuns.find((summaryRun) => {
      return summaryRun.bossFights[bossIndex];
    });

    if (!run) {
      return `Boss ${bossIndex + 1}`;
    }

    return run.bossFights[bossIndex].name || `Boss ${bossIndex + 1}`;
  }

  buildBreakdownRow(kind, label, bossIndex) {
    let cells = this.summaryRuns.map((run) => {
      let breakdown = this.segmentBreakdown(run, bossIndex);
      let duration = breakdown ? breakdown[`${kind}Duration`] : 0;

      return {
        duration,
        formattedDuration: breakdown ? this.formatDuration(duration) : '-',
        missing: !breakdown
      };
    });

    return {
      className: `breakdown-row--${kind}`,
      label,
      cells: this.cellsWithDeltas(cells)
    };
  }

  segmentBreakdown(run, bossIndex) {
    let boss = run.bossFights[bossIndex];

    if (!boss) {
      return null;
    }

    let previousBoss = run.bossFights[bossIndex - 1];
    let segmentStart = previousBoss ? previousBoss.end_time : run.startOffset;
    let segmentEnd = boss.start_time;
    let segmentDuration = Math.max(0, segmentEnd - segmentStart);
    let trashDuration = sum(run.fights.filter((fight) => {
      return fight.boss === 0 && fight.end_time > segmentStart && fight.start_time < segmentEnd;
    }).map((fight) => {
      let startTime = Math.max(fight.start_time, segmentStart);
      let endTime = Math.min(fight.end_time, segmentEnd);

      return Math.max(0, endTime - startTime);
    }));

    return {
      trashDuration,
      gapDuration: Math.max(0, segmentDuration - trashDuration),
      bossDuration: Math.max(0, boss.end_time - boss.start_time)
    };
  }

  cellsWithDeltas(cells) {
    let validCells = cells.filter((cell) => {
      return !cell.missing;
    });

    return cells.map((cell) => {
      if (cell.missing || validCells.length < 2) {
        return {
          ...cell,
          delta: 0,
          formattedDelta: '',
          deltaClass: ''
        };
      }

      let comparisonDuration;

      if (validCells.length === 2) {
        comparisonDuration = validCells.find((validCell) => {
          return validCell !== cell;
        }).duration;
      } else {
        comparisonDuration = min(validCells.map((validCell) => {
          return validCell.duration;
        }));
      }

      let delta = cell.duration - comparisonDuration;

      return {
        ...cell,
        delta,
        formattedDelta: this.formatDelta(delta),
        deltaClass: delta > 0 ? 'delta--slower' : 'delta--faster'
      };
    });
  }

  runDuration(run, startOffset = 0) {
    return max((run.fights || []).filter((fight) => {
      return fight.end_time > startOffset;
    }).map((fight) => {
      return fight.end_time - startOffset;
    })) || 0;
  }

  cooldownsForRun(cooldowns, startOffset) {
    return cooldowns.filter((cooldown) => {
      return cooldown.timestamp >= startOffset;
    }).sort((firstCooldown, secondCooldown) => {
      return firstCooldown.timestamp - secondCooldown.timestamp;
    }).map((cooldown) => {
      let offset = cooldown.timestamp - startOffset;

      return {
        ...cooldown,
        offset,
        formattedTime: this.formatClock(offset)
      };
    });
  }

  cooldownDefinition(cooldownKey) {
    return DPS_COOLDOWN_DEFINITIONS.find((cooldown) => {
      return cooldown.key === cooldownKey;
    });
  }

  cooldownSortIndex(cooldownKey) {
    let index = DPS_COOLDOWN_DEFINITIONS.findIndex((cooldown) => {
      return cooldown.key === cooldownKey;
    });

    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  cooldownLabel(cooldownKey) {
    return cooldownKey.split('-').map((word) => {
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    }).join(' ');
  }

  cooldownCell(cooldowns) {
    return {
      count: cooldowns.length,
      isEmpty: cooldowns.length === 0,
      formattedUses: this.formatUses(cooldowns.length),
      players: this.cooldownPlayers(cooldowns)
    };
  }

  cooldownPlayers(cooldowns) {
    let cooldownsByPlayer = cooldowns.reduce((groupedCooldowns, cooldown) => {
      let playerName = cooldown.sourceName || 'Unknown';

      if (!groupedCooldowns[playerName]) {
        groupedCooldowns[playerName] = [];
      }

      groupedCooldowns[playerName].push(cooldown);

      return groupedCooldowns;
    }, {});

    return Object.keys(cooldownsByPlayer).sort().map((playerName) => {
      let playerCooldowns = cooldownsByPlayer[playerName];

      return {
        name: playerName,
        count: playerCooldowns.length,
        classColorStyle: htmlSafe(`background: ${classColorFor(playerCooldowns[0].sourceType)};`),
        formattedUses: this.formatUses(playerCooldowns.length),
        formattedTimes: playerCooldowns.map((cooldown) => {
          return cooldown.formattedTime;
        }).join(', ')
      };
    });
  }

  formatUses(count) {
    return `${count} ${count === 1 ? 'use' : 'uses'}`;
  }

  formatClock(milliseconds) {
    let totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  formatDelta(milliseconds) {
    let totalSeconds = Math.round(milliseconds / 1000);

    if (totalSeconds === 0) {
      return '';
    }

    let sign = totalSeconds > 0 ? '+' : '-';
    let absoluteSeconds = Math.abs(totalSeconds);
    let minutes = Math.floor(absoluteSeconds / 60);
    let seconds = absoluteSeconds % 60;

    if (minutes > 0 && seconds > 0) {
      return `${sign}${minutes}m ${seconds}s`;
    }

    if (minutes > 0) {
      return `${sign}${minutes}m`;
    }

    return `${sign}${seconds}s`;
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
