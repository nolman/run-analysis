import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class SearchComponent extends Component {
  @service router;
  @tracked logid;

  @action
  search(e) {
    e.preventDefault();
    let existingLogs = this.router.currentRoute.params.logids;
    
    this.router.transitionTo('analysis', this.logid);
  }
}
