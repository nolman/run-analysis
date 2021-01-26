import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { computed } from '@ember/object';
import { times } from 'lodash';

export default class MarkerComponent extends Component {
  get intervals() {
    let raidSeconds = this.args.maxLength / 1000;
    let maxFiveMinInterval = Math.ceil(raidSeconds/300);
    return times(maxFiveMinInterval, (i) => { return i * 300 });
  }
}
