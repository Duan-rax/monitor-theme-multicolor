import assert from "node:assert/strict"

import { historyRanges } from "./ranges.ts"

assert.deepEqual(historyRanges(7).map((range) => range.label), ["1 小时", "6 小时", "24 小时", "7 天"])
assert.deepEqual(historyRanges(14).map((range) => range.label).slice(-2), ["7 天", "14 天"])
assert.deepEqual(historyRanges(30).map((range) => range.label).slice(-3), ["7 天", "14 天", "30 天"])
assert.equal(historyRanges(Number.NaN).at(-1)?.label, "7 天")

console.log("ranges: ok")
