import test from "node:test";
import assert from "node:assert/strict";

import {
  validateRawPayload,
  buildPriceInput,
  buildShelfLifeInput,
  buildAdvisoryInput,
} from "../src/services/validationService.js";
import { validPayload } from "./helpers.js";

test("validateRawPayload accepts valid payload and strips unknown fields", () => {
  const result = validateRawPayload({
    ...validPayload,
    unexpected: "should-be-stripped",
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.unexpected, undefined);
  assert.equal(result.data.grade, "A");
});

test("validateRawPayload rejects invalid payload", () => {
  const result = validateRawPayload({
    ...validPayload,
    grade: "Z",
    moisture: 250,
  });

  assert.equal(result.valid, false);
  assert.ok(Array.isArray(result.errors));
  assert.ok(result.errors.length >= 2);
});

test("model input builders map fields for each AI pipeline", () => {
  const priceInput = buildPriceInput(validPayload);
  const shelfInput = buildShelfLifeInput(validPayload);
  const advisoryInput = buildAdvisoryInput(validPayload);

  assert.deepEqual(priceInput, {
    purity: validPayload.purity,
    grade: validPayload.grade,
    impurities: validPayload.impurities,
  });

  assert.deepEqual(shelfInput, {
    temperature: validPayload.temperature,
    humidity: validPayload.humidity,
    moisture: validPayload.moisture,
  });

  assert.deepEqual(advisoryInput, {
    temperature: validPayload.temperature,
    humidity: validPayload.humidity,
    moisture: validPayload.moisture,
    purity: validPayload.purity,
    grade: validPayload.grade,
    husk: validPayload.impurities.husk,
    stone: validPayload.impurities.stones,
    broken: validPayload.impurities.brokenPieces,
    insect_damage: validPayload.impurities.insectDamage,
    black_seed: validPayload.impurities.blackSpots,
    discoloration: validPayload.impurities.discolored,
    language: "en",
  });
});
