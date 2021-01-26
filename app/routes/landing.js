import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { compact } from 'lodash';

export default class LandingRoute extends Route {
  queryParams = {
    logids: { refreshModel: true },
    offsets: { refreshModel: false }
  };
  model(params) {
    let logIds = compact(params.logids.split('~'));
    let rsvpHash = {};

    logIds.map((logId) => {
      rsvpHash[logId] = hash({
        data: fetch(`https://classic.warcraftlogs.com/v1/report/fights/${logId}?api_key=5794f8362451bf33d8c7ada01c16e3ff`).then((r) => {
          return r.json();
        })
      })
    });
    return hash(rsvpHash);
  }
}
