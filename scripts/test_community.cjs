const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/community-motion.js'), 'utf8');
const math = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('the character follows at a bounded speed without overshooting', async () => {
  const { stepToward } = await math;
  const moved = stepToward({ x: 0, y: 0 }, { x: 3, y: 4 }, 1, 100);
  assert.equal(moved.x, 3); assert.equal(moved.y, 4); assert.equal(moved.moving, false);
  assert.deepEqual(stepToward({ x: 8, y: 5 }, { x: 8, y: 5 }, .01), { x: 8, y: 5, moving: false });
});
test('large frame gaps cannot teleport the character across the map', async () => {
  const { stepToward } = await math;
  assert.equal(stepToward({ x: 0, y: 0 }, { x: 1000, y: 0 }, 15, 100).x, 5);
});
test('only the illustrated map receives pointer tracking', async () => {
  const { insideMap } = await math;
  assert.equal(insideMap(.5, .5), true);
  for (const point of [[0, 0], [1, 1], [1, 0], [0, 1], [NaN, .5]]) assert.equal(insideMap(...point), false);
});
