import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';

export default class CooldownMarkerComponent extends Component {
  get timelineLength() {
    return this.args.timelineLength || 1;
  }

  get styleAttributes() {
    let leftOffset = (this.args.cooldown.offset / this.timelineLength) * 100;

    return htmlSafe(`left: ${leftOffset}%;`);
  }

  get title() {
    let cooldown = this.args.cooldown;

    return `${cooldown.name} - ${cooldown.sourceName} at ${cooldown.formattedTime}`;
  }
}
