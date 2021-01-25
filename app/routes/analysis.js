import Route from '@ember/routing/route';
import { all } from 'rsvp';

export default class AnalysisRoute extends Route {
  model(params) {
    let logIds = params.logids.split(',');
    let promises = logIds.map((logId) => {
      return fetch(`https://classic.warcraftlogs.com/v1/report/fights/${logId}?api_key=5794f8362451bf33d8c7ada01c16e3ff`).then((r) => {
        return r.json();
      })
    });
    return all(promises);
  }
}
