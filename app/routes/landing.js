import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { compact } from 'lodash';

export default class LandingRoute extends Route {
  queryParams = {
    logids: { refreshModel: true },
    offsets: { refreshModel: true }
  };
  model(params) {
    let logIds = compact(params.logids.split(','));
    let rsvpHash = {};

    logIds.map((logId) => {
      rsvpHash[logId] = fetch(`https://classic.warcraftlogs.com/v1/report/fights/${logId}?api_key=5794f8362451bf33d8c7ada01c16e3ff`).then((r) => {
        return r.json();
      })
    });
    return hash(rsvpHash);
  }
}
