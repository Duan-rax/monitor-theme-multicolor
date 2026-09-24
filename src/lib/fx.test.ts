/// <reference types="node" />
import assert from "node:assert/strict"
import { parseUsdRates, remainingAmount, toCny } from "./fx.ts"

const fx = parseUsdRates([
  { date: "2026-09-24", base: "USD", quote: "CNY", rate: 7 },
  { date: "2026-09-24", base: "USD", quote: "EUR", rate: 0.875 },
], 1)

assert.equal(toCny(10, "USD", fx.rates), 70)
assert.equal(toCny(8.75, "EUR", fx.rates), 70)
assert.equal(toCny(70, "CNY", fx.rates), 70)
assert.equal(toCny(10, "ABC", fx.rates), null)

assert.equal(remainingAmount({ price: 30, billing_cycle: "monthly", expires_in: 15, expires_at: null }), 15)
assert.equal(remainingAmount({ price: 120, billing_cycle: "yearly", expires_in: 365, expires_at: null }), 120)
assert.equal(remainingAmount({ price: 9, billing_cycle: "once", expires_in: null, expires_at: null }), 9)
assert.equal(remainingAmount({ price: 9, billing_cycle: "once", expires_in: -1, expires_at: null }), 0)

console.log("exchange rates and remaining value pass")
