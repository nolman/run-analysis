import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Controller | landing', function(hooks) {
  setupTest(hooks);

  test('it stores start offsets in query param format', function(assert) {
    let controller = this.owner.lookup('controller:landing');

    controller.setStartOffset('firstLog', 12345);
    assert.strictEqual(controller.offsets, 'firstLog:12345');
    assert.strictEqual(controller.startOffsets.firstLog, 12345);

    controller.setStartOffset('secondLog', 67890);
    assert.strictEqual(controller.offsets, 'firstLog:12345~secondLog:67890');

    controller.setStartOffset('firstLog', 0);
    assert.strictEqual(controller.offsets, 'secondLog:67890');
  });

  test('removing a log also removes its start offset', function(assert) {
    let controller = this.owner.lookup('controller:landing');
    controller.logids = 'firstLog~secondLog';
    controller.offsets = 'firstLog:12345~secondLog:67890';

    controller.removeLog('firstLog');

    assert.strictEqual(controller.logids, 'secondLog');
    assert.strictEqual(controller.offsets, 'secondLog:67890');
  });

  test('it summarizes run durations from fight timelines', function(assert) {
    let controller = this.owner.lookup('controller:landing');
    controller.model = {
      firstLog: {
        data: {
          start: 0,
          end: 31 * 60 * 1000,
          fights: [
            { end_time: 20 * 60 * 1000 },
            { end_time: 31 * 60 * 1000 }
          ]
        }
      },
      secondLog: {
        data: {
          start: 0,
          end: 2 * 60 * 60 * 1000,
          fights: [
            { end_time: 22 * 60 * 1000 },
            { end_time: 35 * 60 * 1000 }
          ]
        }
      }
    };

    assert.strictEqual(controller.fastestRaidLength, 31 * 60 * 1000);
    assert.strictEqual(controller.slowestRaidLength, 35 * 60 * 1000);
    assert.strictEqual(controller.raidSpread, 4 * 60 * 1000);
    assert.strictEqual(controller.formattedRaidSpread, '4m 0s');
  });

  test('it summarizes run durations from selected start offsets', function(assert) {
    let controller = this.owner.lookup('controller:landing');
    controller.offsets = 'firstLog:6180000';
    controller.model = {
      firstLog: {
        data: {
          fights: [
            { end_time: 20 * 60 * 1000 },
            { end_time: 134 * 60 * 1000 }
          ]
        }
      },
      secondLog: {
        data: {
          fights: [
            { end_time: 35 * 60 * 1000 }
          ]
        }
      }
    };

    assert.strictEqual(controller.fastestRaidLength, 31 * 60 * 1000);
    assert.strictEqual(controller.slowestRaidLength, 35 * 60 * 1000);
    assert.strictEqual(controller.raidSpread, 4 * 60 * 1000);
    assert.strictEqual(controller.formattedFastestRaidLength, '31m 0s');
    assert.strictEqual(controller.formattedSlowestRaidLength, '35m 0s');
    assert.strictEqual(controller.formattedRaidSpread, '4m 0s');
  });
});
