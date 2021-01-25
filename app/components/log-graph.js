import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class LogGraphComponent extends Component {
  @tracked startOffset = 0;

  @action
  setStartOffset(startOffset) {
    this.startOffset = startOffset;
  }

  @action
  resetOffset() {
    this.startOffset = 0;
  }
}
