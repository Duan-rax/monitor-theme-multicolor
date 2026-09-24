/// <reference types="node" />
import assert from "node:assert/strict"
import { healthLevel, loadPercent, worstHealth } from "./health.ts"

assert.equal(healthLevel(0), "healthy")
assert.equal(healthLevel(59.99), "healthy")
assert.equal(healthLevel(60), "load")
assert.equal(healthLevel(74.99), "load")
assert.equal(healthLevel(75), "severe")
assert.equal(healthLevel(89.99), "severe")
assert.equal(healthLevel(90), "danger")
assert.equal(healthLevel(150), "danger")
assert.equal(healthLevel(Number.NaN), "healthy")

assert.equal(loadPercent(2, 4), 50)
assert.equal(loadPercent(8, 4), 200)
assert.equal(loadPercent(1, 0), 0)

assert.equal(worstHealth([12, 61, 76, 91]), "danger")
assert.equal(worstHealth([12, null, undefined]), "healthy")
assert.equal(worstHealth([74, 76]), "severe")

console.log("health thresholds and load normalization")
