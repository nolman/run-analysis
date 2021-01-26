import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { queryParam } from 'ember-parachute/decorators';
import { A } from '@ember/array';
import { or } from '@ember/object/computed';
import { action } from '@ember/object';
import { compact, concat, max, uniq, values, without } from 'lodash';

export default class LandingController extends Controller {
  queryParams = ['logids', 'offsets'];
  @tracked newLogId = '';
  @tracked logids = '';
  @tracked offsets = '';
  @tracked msPerPixel = 5000;

  get maxRaidLength() {
    let durations = values(this.model).map((instance) => {
      return instance.data.end - instance.data.start;
    });
    return max(durations);
  }

  @action
  addLog(e) {
    e.preventDefault();
    let existingIds = compact(this.logids.split('~'));
    let newLogsIds = uniq(concat(existingIds, this.newLogId));
    this.logids = newLogsIds.join('~') ;
    console.log(this.logids)
    this.newLogId = '';
  }
  @action
  removeLog(logId) {
    let existingIds = compact(this.logids.split('~'))
    let newLogsIds = without(existingIds, logId);
    this.logids = newLogsIds.join(',') ;
  }
}
