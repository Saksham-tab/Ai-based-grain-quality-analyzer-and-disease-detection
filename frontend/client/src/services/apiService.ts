import fallbackDataService from './fallbackDataService';

const getEnvValue = (key: string) => {
  const env = (import.meta as any)?.env;
  if (env) {
    return env[key];
  }
  return undefined;
};

const DEFAULT_API_BASE_URL = getEnvValue('VITE_API_URL') || 'http://localhost:5000/api';
const DEFAULT_API_TIMEOUT = 5000;

type ApiServiceDeps = {
  apiBaseUrl?: string;
  apiTimeout?: number;
  fallbackData?: typeof fallbackDataService;
  fetchImpl?: typeof fetch;
};

const createFetchWithTimeout = (
  fetchImpl: typeof fetch,
  timeoutMs: number,
) => async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createApiService = ({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  apiTimeout = DEFAULT_API_TIMEOUT,
  fallbackData = fallbackDataService,
  fetchImpl = fetch,
}: ApiServiceDeps = {}) => {
  const fetchWithTimeout = createFetchWithTimeout(fetchImpl, apiTimeout);

  return {
    async getLatestReport() {
      try {
        const response = await fetchWithTimeout(`${apiBaseUrl}/reports/latest`);
        if (!response.ok) {
          console.warn(`API error: ${response.status}, using fallback data`);
          return fallbackData.getDefaultGrainData();
        }

        const data = await response.json();
        return data?.data || fallbackData.getDefaultGrainData();
      } catch (error) {
        console.error('Error fetching latest report, using fallback:', error);
        return fallbackData.getDefaultGrainData();
      }
    },

    async getReports(limit: number = 20, search: string = "") {
      try {
        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          search: search
        });
        const response = await fetchWithTimeout(`${apiBaseUrl}/reports?${queryParams}`);
        if (!response.ok) {
          console.warn(`API error: ${response.status}`);
          return [];
        }

        const result = await response.json();
        return result?.data || [];
      } catch (error) {
        console.error('Error fetching reports:', error);
        return [];
      }
    },

    async getReportById(id: string) {
      try {
        const response = await fetchWithTimeout(`${apiBaseUrl}/reports/${id}`);
        if (!response.ok) {
          console.warn(`Report not found (${response.status}), using fallback`);
          return fallbackData.getDefaultGrainData();
        }

        const data = await response.json();
        return data?.data || fallbackData.getDefaultGrainData();
      } catch (error) {
        console.error(`Error fetching report ${id}, using fallback:`, error);
        return fallbackData.getDefaultGrainData();
      }
    },

    async submitAnalysis(data: Record<string, unknown>) {
      try {
        const response = await fetchWithTimeout(`${apiBaseUrl}/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          console.warn(`Analysis submission failed (${response.status}), using fallback`);
          const fallback = fallbackData.getDefaultGrainData();
          return { ...fallback, success: false, message: 'API unavailable' };
        }

        const result = await response.json();
        return result?.data || fallbackData.getDefaultGrainData();
      } catch (error) {
        console.error('Error submitting analysis, using fallback:', error);
        const fallback = fallbackData.getDefaultGrainData();
        return { ...fallback, success: false, message: 'Failed to submit analysis' };
      }
    },

    async healthCheck() {
      try {
        const response = await fetchWithTimeout(`${apiBaseUrl.replace('/api', '')}/`);
        return response.ok;
      } catch {
        return false;
      }
    },
    async captureGrain() {
      try {
        const response = await fetchWithTimeout(`${apiBaseUrl}/reports/capture`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error(`Capture failed: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error triggering capture:', error);
        throw error;
      }
    },
    async downloadReportPdf(id: string) {
      // Simply trigger a browser download by navigating to the PDF endpoint
      window.location.href = `${apiBaseUrl}/reports/${id}/pdf`;
    },
  };
};

export const apiService = createApiService();

export default apiService;
