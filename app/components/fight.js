import Component from '@glimmer/component';
import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/template';

export default class FightComponent extends Component {
  popperOptions = {
    modifiers: {
      preventOverflow: {
        escapeWithReference: false
      }
    }
  };

  @alias('args.fight') fight;
  @alias('args.msPerPixel') msPerPixel;
  @alias('args.startOffset') startOffset;
  @alias('args.fight.start_time') startTime;
  @alias('args.fight.end_time') endTime;
  @alias('args.fight.name') name;
  @alias('args.fight.boss') bossId;

  @computed('args.fight.boss', 'args.fight.name')
  get isBoss() {
    return this.bossId !== 0;
  }

  @computed('args.fight.start_time', 'args.startOffset')
  get adjustedStartTime() {
    return this.startTime - this.startOffset;
  }

  @computed('args.fight.{start_time,end_time}')
  get fightLength() {
    return (this.endTime - this.startTime) / 1000;
  }

  @computed('args.fight.boss', 'args.fight.kill')
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

  @computed('args.fight.id', 'args.startOffset')
  get styleAttributes() {
    let width = (this.endTime - this.startTime) / this.msPerPixel;
    let leftOffset = (this.adjustedStartTime) / this.msPerPixel;
    let fightColor = this.isBoss ? 'blue' : 'red';
    return htmlSafe(`width: ${width}px; left: ${leftOffset}px;`);
  }
}
