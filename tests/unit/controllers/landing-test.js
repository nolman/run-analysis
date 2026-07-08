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

  test('it builds boss-aligned breakdown rows with trash and gaps', function(assert) {
    let controller = this.owner.lookup('controller:landing');
    controller.model = {
      firstLog: {
        data: {
          title: 'First Run',
          fights: [
            { boss: 0, name: 'Trash', start_time: 0, end_time: 60000 },
            { boss: 101, name: 'Boss One', start_time: 120000, end_time: 180000 },
            { boss: 0, name: 'Different Trash Name', start_time: 240000, end_time: 300000 },
            { boss: 102, name: 'Boss Two', start_time: 360000, end_time: 480000 }
          ]
        }
      },
      secondLog: {
        data: {
          title: 'Second Run',
          fights: [
            { boss: 0, name: 'Other Trash', start_time: 0, end_time: 90000 },
            { boss: 101, name: 'Boss One', start_time: 90000, end_time: 150000 },
            { boss: 0, name: 'More Trash', start_time: 210000, end_time: 270000 },
            { boss: 102, name: 'Boss Two', start_time: 300000, end_time: 420000 }
          ]
        }
      }
    };

    let rows = controller.breakdownRows;

    assert.deepEqual(rows.map((row) => row.label), [
      'Trash before Boss One',
      'Gaps before Boss One',
      'Boss One',
      'Trash before Boss Two',
      'Gaps before Boss Two',
      'Boss Two'
    ]);

    assert.deepEqual(rows[0].cells.map((cell) => cell.duration), [60000, 90000]);
    assert.deepEqual(rows[1].cells.map((cell) => cell.duration), [60000, 0]);
    assert.deepEqual(rows[2].cells.map((cell) => cell.duration), [60000, 60000]);
    assert.deepEqual(rows[3].cells.map((cell) => cell.duration), [60000, 60000]);
    assert.deepEqual(rows[4].cells.map((cell) => cell.duration), [120000, 90000]);
    assert.deepEqual(rows[5].cells.map((cell) => cell.duration), [120000, 120000]);
    assert.deepEqual(rows[0].cells.map((cell) => cell.formattedDelta), ['-30s', '+30s']);
    assert.deepEqual(rows[0].cells.map((cell) => cell.deltaClass), ['delta--faster', 'delta--slower']);
    assert.deepEqual(rows[2].cells.map((cell) => cell.formattedDelta), ['', '']);
    assert.deepEqual(rows[4].cells.map((cell) => cell.formattedDelta), ['+30s', '-30s']);
  });

  test('it aggregates cooldowns by cooldown, run, and player', function(assert) {
    let controller = this.owner.lookup('controller:landing');
    controller.offsets = 'firstLog:60000';
    controller.model = {
      firstLog: {
        data: {
          title: 'First Run',
          fights: [
            { boss: 0, name: 'Trash', start_time: 0, end_time: 60000 },
            { boss: 101, name: 'Boss One', start_time: 120000, end_time: 180000 }
          ]
        },
        cooldowns: [
          { key: 'death-wish', name: 'Death Wish', timestamp: 30000, sourceName: 'Warrior One' },
          { key: 'death-wish', name: 'Death Wish', timestamp: 90000, sourceName: 'Warrior One' },
          { key: 'death-wish', name: 'Death Wish', timestamp: 150000, sourceName: 'Warrior Two' },
          { key: 'recklessness', name: 'Recklessness', timestamp: 120000, sourceName: 'Warrior One' }
        ]
      },
      secondLog: {
        data: {
          title: 'Second Run',
          fights: [
            { boss: 0, name: 'Trash', start_time: 0, end_time: 60000 },
            { boss: 101, name: 'Boss One', start_time: 90000, end_time: 150000 }
          ]
        },
        cooldowns: [
          { key: 'death-wish', name: 'Death Wish', timestamp: 60000, sourceName: 'Warrior Three' }
        ]
      }
    };

    let rows = controller.cooldownRows;

    assert.deepEqual(rows.map((row) => row.label), ['Death Wish', 'Recklessness']);
    assert.strictEqual(rows[0].cells[0].count, 2);
    assert.strictEqual(rows[0].cells[0].formattedUses, '2 uses');
    assert.deepEqual(rows[0].cells[0].players.map((player) => {
      return `${player.name}: ${player.formattedUses} at ${player.formattedTimes}`;
    }), [
      'Warrior One: 1 use at 0:30',
      'Warrior Two: 1 use at 1:30'
    ]);
    assert.strictEqual(rows[0].cells[1].count, 1);
    assert.deepEqual(rows[0].cells[1].players.map((player) => {
      return `${player.name}: ${player.formattedUses} at ${player.formattedTimes}`;
    }), ['Warrior Three: 1 use at 1:00']);
    assert.strictEqual(rows[1].cells[0].players[0].formattedTimes, '1:00');
    assert.true(rows[1].cells[1].isEmpty);
  });
});
