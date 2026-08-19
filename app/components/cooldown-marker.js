import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { classColorFor } from 'run-analysis/utils/class-colors';

export default class CooldownMarkerComponent extends Component {
  popperOptions = {
    modifiers: {
      flip: {
        enabled: false
      },
      offset: {
        offset: '0, 0'
      },
      preventOverflow: {
        enabled: true,
        escapeWithReference: false,
        boundariesElement: 'viewport'
      },
      hide: {
        enabled: false
      }
    }
  };

  get cooldownGroup() {
    return this.args.cooldownGroup;
  }

  get cooldowns() {
    return this.cooldownGroup.cooldowns.map((cooldown) => {
      return {
        ...cooldown,
        classColorStyle: htmlSafe(`background: ${classColorFor(cooldown.sourceType)};`)
      };
    });
  }

  get timelineLength() {
    return this.args.timelineLength || 1;
  }

  get styleAttributes() {
    let leftOffset = (this.cooldownGroup.offset / this.timelineLength) * 100;

    return htmlSafe(`left: ${leftOffset}%;`);
  }

  get stackStyle() {
    let count = this.cooldownGroup.count;
    let stackHeight = Math.min(56, 7 + (count * 5));

    return htmlSafe(`height: ${stackHeight}px;`);
  }

  get heading() {
    return `${this.cooldownGroup.formattedTime} cooldowns`;
  }

  get useLabel() {
    let count = this.cooldownGroup.count;

    return `${count} ${count === 1 ? 'use' : 'uses'}`;
  }

  get ariaLabel() {
    return `${this.useLabel} at ${this.cooldownGroup.formattedTime}`;
  }
}
