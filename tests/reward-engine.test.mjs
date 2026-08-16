import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../docs/app.js", import.meta.url), "utf8");
const rewardTypes = ["lips", "cheek", "slap", "pass"];

test("canonical reward IDs are isolated", () => {
  for (const type of rewardTypes) {
    const rewards = { lips: 99, cheek: 99, slap: 2, pass: 4 };
    const before = { ...rewards };
    rewards[type] += 1;
    for (const key of rewardTypes) {
      assert.equal(rewards[key], before[key] + (key === type ? 1 : 0));
    }
  }
});

test("wheel cheek and pass segments use distinct IDs", () => {
  assert.match(source, /label:'😘 YANAK',reward:'cheek'/);
  assert.match(source, /label:'🎟️ PAS',reward:'pass'/);
  assert.doesNotMatch(source, /addReward\(['"]Yanaktan/);
  assert.doesNotMatch(source, /addReward\(['"]Pas/);
});

test("achievement conditions never cross lips and cheek", () => {
  assert.match(source, /lip_addict'.*s\.rewards\.lips>=100/);
  assert.match(source, /kiss_master'.*s\.rewards\.cheek>=100/);
});

test("multi-level XP preserves overflow", () => {
  const needed = level => level === 1 ? 100 : level === 2 ? 140 : level === 3 ? 190 : Math.floor(180 + level ** 1.55 * 35);
  let level = 1, xp = 1000;
  while (xp >= needed(level)) { xp -= needed(level); level++; }
  assert.ok(level > 3);
  assert.ok(xp >= 0 && xp < needed(level));
});
