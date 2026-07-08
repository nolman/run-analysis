import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { computed } from '@ember/object';

export default class MarkerComponent extends Component {
  @computed('args.interval')
  get label() {
    if(this.args.interval === 0) {
      return '0'
    } else {
      return `${(this.args.interval / 60)}m`
    }
  }
  get styleAttributes() {
    let maxLength = this.args.maxLength || 1;
    let leftOffset = ((this.args.interval * 1000) / maxLength) * 100;

    return htmlSafe(`left: ${leftOffset}%;`);
  }
}
