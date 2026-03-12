import test from "node:test";
import assert from "node:assert/strict";

import { createSensorRealtimeEmitter } from "../src/services/socketService.js";

test("sensor realtime emitter sends frontend payload with temperature/humidity/moisture", () => {
  const emitted = [];
  const emitRealtime = createSensorRealtimeEmitter({
    ioGetter: () => ({
      emit(event, payload) {
        emitted.push({ event, payload });
      },
    }),
  });

  emitRealtime({
    temperature: 27.3,
    humidity: 61.4,
    moisture: 12.1,
    ignored: "field",
  });

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].event, "sensor:update");
  assert.equal(emitted[0].payload.temperature, 27.3);
  assert.equal(emitted[0].payload.humidity, 61.4);
  assert.equal(emitted[0].payload.moisture, 12.1);
  assert.ok(emitted[0].payload.timestamp instanceof Date);
  assert.equal(emitted[0].payload.ignored, undefined);
});

test("sensor realtime emitter handles unavailable socket server without throwing", () => {
  const emitRealtime = createSensorRealtimeEmitter({
    ioGetter: () => {
      throw new Error("socket.io not initialized");
    },
  });

  assert.doesNotThrow(() =>
    emitRealtime({
      temperature: 25,
      humidity: 60,
      moisture: 12,
    }),
  );
});
