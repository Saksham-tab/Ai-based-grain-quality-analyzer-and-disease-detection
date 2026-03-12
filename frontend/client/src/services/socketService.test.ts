import test from 'node:test';
import assert from 'node:assert/strict';

import { createSocketService } from './socketService';

class FakeSocket {
  connected = false;
  id = 'fake-socket-1';
  handlers = new Map<string, Set<(...args: any[]) => void>>();
  emitted: Array<{ event: string; payload: any }> = [];
  disconnected = false;

  on(event: string, handler: (...args: any[]) => void) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)?.add(handler);
    return this;
  }

  off(event: string, handler: (...args: any[]) => void) {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  emit(event: string, payload: any) {
    this.emitted.push({ event, payload });
    return this;
  }

  disconnect() {
    this.disconnected = true;
    this.connected = false;
    return this;
  }

  trigger(event: string, ...args: any[]) {
    const callbacks = this.handlers.get(event);
    if (!callbacks) return;
    callbacks.forEach((callback) => callback(...args));
  }
}

test('onGrainDataUpdate relays live socket sensor:update payload', () => {
  const fakeSocket = new FakeSocket();
  fakeSocket.connected = true;

  const service = createSocketService({
    socketFactory: () => fakeSocket as any,
    intervalMs: 10,
  });

  let received: any = null;
  const unsubscribe = service.onGrainDataUpdate((data) => {
    received = data;
  });

  fakeSocket.trigger('sensor:update', {
    temperature: 29.1,
    humidity: 66.2,
    moisture: 12.8,
  });

  assert.equal(received.temperature, 29.1);
  assert.equal(received.humidity, 66.2);
  assert.equal(received.moisture, 12.8);
  unsubscribe();
});

test('onGrainDataUpdate emits simulated fallback payload when socket is disconnected', async () => {
  const fakeSocket = new FakeSocket();
  fakeSocket.connected = false;

  const service = createSocketService({
    socketFactory: () => fakeSocket as any,
    fallbackData: {
      getDefaultSensorData: () => ({
        temperature: 30,
        humidity: 70,
        moisture: 13,
      }),
    } as any,
    intervalMs: 10,
  });

  const received: any[] = [];
  const unsubscribe = service.onGrainDataUpdate((data) => {
    received.push(data);
  });

  await new Promise((resolve) => setTimeout(resolve, 25));

  assert.ok(received.length > 0);
  assert.equal(received[0].temperature, 30);
  assert.equal(received[0].humidity, 70);
  assert.equal(received[0].moisture, 13);
  assert.equal(received[0]._isFallback, true);

  unsubscribe();
  service.disconnect();
});

test('emitAnalysisRequest sends event only when connected', () => {
  const fakeSocket = new FakeSocket();
  fakeSocket.connected = false;

  const service = createSocketService({
    socketFactory: () => fakeSocket as any,
  });

  service.emitAnalysisRequest({ sample: 1 });
  assert.equal(fakeSocket.emitted.length, 0);

  fakeSocket.connected = true;
  service.emitAnalysisRequest({ sample: 2 });

  assert.equal(fakeSocket.emitted.length, 1);
  assert.equal(fakeSocket.emitted[0].event, 'analyze-grain');
});
