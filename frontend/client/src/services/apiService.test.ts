import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiService } from './apiService';

const fallbackReport = { _id: 'fallback-report', purity: 87.5 };

const fallbackData = {
  getDefaultGrainData: () => fallbackReport,
};

test('getLatestReport returns Mongo API data when backend responds successfully', async () => {
  const api = createApiService({
    apiBaseUrl: 'http://localhost:5000/api',
    fallbackData: fallbackData as any,
    fetchImpl: async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            _id: 'mongo-1',
            aiOutputs: {
              price: { value: 2500 },
            },
          },
        }),
      }) as any,
  });

  const result = await api.getLatestReport();
  assert.equal(result._id, 'mongo-1');
  assert.equal(result.aiOutputs.price.value, 2500);
});

test('getLatestReport falls back when API is unavailable', async () => {
  const api = createApiService({
    fallbackData: fallbackData as any,
    fetchImpl: async () => {
      throw new Error('network down');
    },
  });

  const result = await api.getLatestReport();
  assert.equal(result._id, 'fallback-report');
});

test('submitAnalysis returns fallback response when agents/backend pipeline is down', async () => {
  const api = createApiService({
    fallbackData: fallbackData as any,
    fetchImpl: async () =>
      ({
        ok: false,
        status: 500,
        json: async () => ({}),
      }) as any,
  });

  const result = await api.submitAnalysis({ moisture: 12.1 });
  assert.equal(result._id, 'fallback-report');
  assert.equal(result.success, false);
});
