import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { compact } from 'lodash';
import { DPS_COOLDOWN_DEFINITIONS } from 'run-analysis/utils/dps-cooldowns';

const API_KEY = '5794f8362451bf33d8c7ada01c16e3ff';
const API_BASE = 'https://classic.warcraftlogs.com/v1';
const MAX_EVENT_PAGES = 20;

export default class LandingRoute extends Route {
  queryParams = {
    logids: { refreshModel: true },
    offsets: { refreshModel: false },
    names: { refreshModel: false }
  };

  model(params) {
    let logIds = compact((params.logids || '').split('~'));
    let rsvpHash = {};

    logIds.map((logId) => {
      let reportPromise = fetch(`${API_BASE}/report/fights/${logId}?api_key=${API_KEY}`).then((r) => {
        return r.json();
      });

      rsvpHash[logId] = hash({
        data: reportPromise,
        cooldowns: reportPromise.then((report) => {
          return this.fetchCooldowns(logId, report);
        }).catch(() => {
          return [];
        })
      });
    });

    return hash(rsvpHash);
  }

  async fetchCooldowns(logId, report) {
    let endTime = this.reportEndTime(report);

    if (endTime <= 0) {
      return [];
    }

    let friendlyActors = this.friendlyActorsById(report);
    let cooldownRequests = DPS_COOLDOWN_DEFINITIONS.map((cooldown) => {
      return cooldown.abilityIds.map((abilityId) => {
        return this.fetchCooldownEvents(logId, endTime, cooldown, abilityId, friendlyActors);
      });
    }).flat();
    let cooldownBatches = await Promise.all(cooldownRequests);

    return this.dedupeCooldowns(cooldownBatches.flat()).sort((firstCooldown, secondCooldown) => {
      return firstCooldown.timestamp - secondCooldown.timestamp;
    });
  }

  async fetchCooldownEvents(logId, endTime, cooldown, abilityId, friendlyActors) {
    let cooldowns = [];
    let startTime = 0;
    let pageCount = 0;

    while (startTime < endTime && pageCount < MAX_EVENT_PAGES) {
      let response = await fetch(this.cooldownEventsUrl(logId, startTime, endTime, abilityId));

      if (!response.ok) {
        return cooldowns;
      }

      let payload = await response.json();

      cooldowns = cooldowns.concat((payload.events || []).map((event) => {
        return this.normalizeCooldownEvent(event, cooldown, abilityId, friendlyActors);
      }).filter(Boolean));

      if (!payload.nextPageTimestamp || payload.nextPageTimestamp <= startTime) {
        break;
      }

      startTime = payload.nextPageTimestamp;
      pageCount += 1;
    }

    return cooldowns;
  }

  cooldownEventsUrl(logId, startTime, endTime, abilityId) {
    return `${API_BASE}/report/events/casts/${logId}?start=${startTime}&end=${endTime}&abilityid=${abilityId}&api_key=${API_KEY}`;
  }

  normalizeCooldownEvent(event, cooldown, abilityId, friendlyActors) {
    let sourceId = event.sourceID;
    let source = friendlyActors[sourceId];

    if (event.sourceIsFriendly === false || !source) {
      return null;
    }

    return {
      key: cooldown.key,
      name: cooldown.name,
      abilityId,
      timestamp: event.timestamp,
      sourceId,
      sourceName: source.name,
      sourceType: source.type
    };
  }

  friendlyActorsById(report) {
    return (report.friendlies || []).reduce((actors, actor) => {
      actors[actor.id] = {
        name: actor.name,
        type: actor.type
      };

      return actors;
    }, {});
  }

  reportEndTime(report) {
    return (report.fights || []).reduce((endTime, fight) => {
      return Math.max(endTime, fight.end_time || 0);
    }, 0);
  }

  dedupeCooldowns(cooldowns) {
    let seenCooldowns = {};

    return cooldowns.filter((cooldown) => {
      let key = `${cooldown.key}:${cooldown.timestamp}:${cooldown.sourceId}`;

      if (seenCooldowns[key]) {
        return false;
      }

      seenCooldowns[key] = true;

      return true;
    });
  }
}
