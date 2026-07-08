import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';

export default class FightComponent extends Component {
  popperOptions = {
    modifiers: {
      flip: {
        enabled: false
      },
      offset: {
        offset: '0, -27'
      },
      preventOverflow: {
        enabled: false,
        escapeWithReference: false
      }
    }
  };

  get fight() {
    return this.args.fight;
  }

  get msPerPixel() {
    return this.args.msPerPixel;
  }

  get startOffset() {
    return this.args.startOffset;
  }

  get startTime() {
    return this.fight.start_time;
  }

  get endTime() {
    return this.fight.end_time;
  }

  get name() {
    return this.fight.name;
  }

  get bossId() {
    return this.fight.boss;
  }

  get isBoss() {
    return this.bossId !== 0;
  }

  get adjustedStartTime() {
    return this.startTime - this.startOffset;
  }

  get fightLength() {
    return (this.endTime - this.startTime) / 1000;
  }

  get formattedFightLength() {
    let minutes = Math.floor(this.fightLength / 60);
    let seconds = Math.round(this.fightLength % 60).toString().padStart(2, '0');

    return `${minutes}:${seconds}`;
  }

  get fightResult() {
    if (!this.isBoss) {
      return 'Trash';
    }

    return this.fight.kill ? 'Kill' : 'Wipe';
  }

  get fightColor() {
    if(this.isBoss) {
      if(this.fight.kill) {
        return 'bg-success';
      } else {
        return 'bg-danger';
      }
    } else {
      return 'bg-info'
    }
  }

  get styleAttributes() {
    let width = Math.max((this.endTime - this.startTime) / this.msPerPixel, 4);
    let leftOffset = (this.adjustedStartTime) / this.msPerPixel;

    return htmlSafe(`width: ${width}px; left: ${leftOffset}px;`);
  }
}
