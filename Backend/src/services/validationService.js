import Joi from "joi";

/* =====================================================
   COMMON PERCENTAGE FIELD (0–100%)
===================================================== */

const percentageField = Joi.number()
  .min(0)
  .max(100)
  .precision(2)
  .required();


/* =====================================================
   RAW SENSOR + GRAIN PAYLOAD SCHEMA
===================================================== */

const rawPayloadSchema = Joi.object({
  /* ---------- Sensor data ---------- */
  temperature: Joi.number()
    .min(-10)
    .max(80)
    .precision(2)
    .required(),

  humidity: percentageField,
  moisture: percentageField,

  /* ---------- Grain quality ---------- */
  purity: percentageField,

  /* ---------- Grade from image ML ---------- */
  grade: Joi.string()
    .valid("A", "B", "C")
    .required(),

  /* ---------- Impurity analysis (6 params, %) ---------- */
  impurities: Joi.object({
    husk: percentageField,
    stones: percentageField,
    blackSpots: percentageField,
    brokenPieces: percentageField,
    insectDamage: percentageField,
  }).required(),
});


/* =====================================================
   MAIN VALIDATION FUNCTION
===================================================== */

export const validateRawPayload = (data) => {
  const { error, value } = rawPayloadSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return {
      valid: false,
      errors: error.details.map((e) => e.message),
    };
  }

  return {
    valid: true,
    data: value,
  };
};


/* =====================================================
   MODEL-SPECIFIC INPUT BUILDERS
===================================================== */

/**
 * PRICE MODEL INPUT
 * Needs: purity + grade + impurities
 */
export const buildPriceInput = (data) => ({
  purity: data.purity,
  grade: data.grade,
  impurities: data.impurities,
});


/**
 * SHELF-LIFE MODEL INPUT
 * Needs: temperature + humidity + moisture
 */
export const buildShelfLifeInput = (data) => ({
  temperature: data.temperature,
  humidity: data.humidity,
  moisture: data.moisture,
});


/**
 * ADVISORY MODEL INPUT
 * Needs: flat fields matching advisory engine expectations
 */
export const buildAdvisoryInput = (data) => ({
  temperature: data.temperature,
  humidity: data.humidity,
  moisture: data.moisture,
  purity: data.purity,
  grade: data.grade,
  husk: data.impurities?.husk ?? 0,
  stone: data.impurities?.stones ?? 0,
  broken: data.impurities?.brokenPieces ?? 0,
  insect_damage: data.impurities?.insectDamage ?? 0,
  black_seed: data.impurities?.blackSpots ?? 0,
  language: "en",
});
