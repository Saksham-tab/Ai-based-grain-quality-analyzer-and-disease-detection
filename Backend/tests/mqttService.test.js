import test from "node:test";
import assert from "node:assert/strict";

import { createMQTTInitializer } from "../src/services/mqttService.js";
import { validPayload } from "./helpers.js";

class FakeMqttClient {
  constructor() {
    this.handlers = new Map();
    this.subscriptions = [];
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  subscribe(topics, callback) {
    this.subscriptions.push(topics);
    if (callback) {
      callback(null);
    }
  }
}

test("MQTT sensor topic triggers realtime and AI pipelines", async () => {
  const client = new FakeMqttClient();
  const emitCalls = [];
  const storeCalls = [];
  const validateCalls = [];
  const aiCalls = [];

  const initMQTT = createMQTTInitializer({
    mqttLib: {
      connect() {
        return client;
      },
    },
    mqttEnv: {
      MQTT_BROKER_URL: "mqtt://test-broker",
      MQTT_TOPIC_SENSOR: "sensor/live",
    },
    emitRealtime: (payload) => emitCalls.push(payload),
    storeRaw: async (payload) => storeCalls.push(payload),
    validatePayload: (payload) => {
      validateCalls.push(payload);
      return { valid: true, data: payload };
    },
    inferAI: async (payload) => aiCalls.push(payload),
  });

  initMQTT();
  client.handlers.get("connect")();

  const onMessage = client.handlers.get("message");
  await onMessage("sensor/live", Buffer.from(JSON.stringify(validPayload)));

  assert.equal(client.subscriptions.length, 1);
  assert.equal(client.subscriptions[0], "sensor/live");
  assert.equal(emitCalls.length, 1);
  assert.equal(storeCalls.length, 1);
  assert.equal(validateCalls.length, 1);
  assert.equal(aiCalls.length, 1);
});

test("MQTT non-sensor topic skips realtime emit but still runs processing pipeline", async () => {
  const client = new FakeMqttClient();
  const emitCalls = [];
  const storeCalls = [];
  const aiCalls = [];

  const initMQTT = createMQTTInitializer({
    mqttLib: {
      connect() {
        return client;
      },
    },
    mqttEnv: {
      MQTT_BROKER_URL: "mqtt://test-broker",
      MQTT_TOPIC_SENSOR: "sensor/live",
    },
    emitRealtime: (payload) => emitCalls.push(payload),
    storeRaw: async (payload) => storeCalls.push(payload),
    validatePayload: (payload) => ({ valid: true, data: payload }),
    inferAI: async (payload) => aiCalls.push(payload),
  });

  initMQTT();
  const onMessage = client.handlers.get("message");
  await onMessage("other/topic", Buffer.from(JSON.stringify(validPayload)));

  assert.equal(emitCalls.length, 0);
  assert.equal(storeCalls.length, 1);
  assert.equal(aiCalls.length, 1);
});

test("MQTT pipeline stops before AI inference when validation fails", async () => {
  const client = new FakeMqttClient();
  let aiTriggered = false;

  const initMQTT = createMQTTInitializer({
    mqttLib: {
      connect() {
        return client;
      },
    },
    mqttEnv: {
      MQTT_BROKER_URL: "mqtt://test-broker",
      MQTT_TOPIC_SENSOR: "sensor/live",
    },
    emitRealtime: () => {},
    storeRaw: async () => {},
    validatePayload: () => ({ valid: false, errors: ["invalid payload"] }),
    inferAI: async () => {
      aiTriggered = true;
    },
  });

  initMQTT();
  const onMessage = client.handlers.get("message");
  await onMessage("sensor/live", Buffer.from(JSON.stringify(validPayload)));

  assert.equal(aiTriggered, false);
});
