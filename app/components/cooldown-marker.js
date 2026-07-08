import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';

export default class CooldownMarkerComponent extends Component {
  get styleAttributes() {
    let leftOffset = this.args.cooldown.offset / this.args.msPerPixel;

    return htmlSafe(`left: ${leftOffset}px;`);
  }

  get title() {
    let cooldown = this.args.cooldown;

    return `${cooldown.name} - ${cooldown.sourceName} at ${cooldown.formattedTime}`;
  }
}

