import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { queryParam } from 'ember-parachute/decorators';
import { A } from '@ember/array';
import { or } from '@ember/object/computed';
import { action } from '@ember/object';
import { compact, concat, uniq, without } from 'lodash';

export default class LandingController extends Controller {
  queryParams = ['logids'];
  @tracked newLogId = '';
  @tracked logids = '';
  @tracked msPerPixel = 5000;

  @action
  addLog(e) {
    e.preventDefault();
    let existingIds = compact(this.logids.split(','))
    let newLogsIds = uniq(concat(existingIds, this.newLogId));
    this.logids = newLogsIds.join(',') ;
    console.log(this.logids)
    this.newLogId = '';
  }
  @action
  removeLog(logId) {
    let existingIds = compact(this.logids.split(','))
    let newLogsIds = without(existingIds, logId);
    this.logids = newLogsIds.join(',') ;
  }
}
// {logid: {offset: 123, report: fetch, deaths: fetch}}
