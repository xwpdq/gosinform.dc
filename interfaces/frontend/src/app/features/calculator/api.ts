import { API_PREFIX } from './constants';
import type { EstimateRequestItem, EstimateResponse, TariffListResponse } from './types';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchTariffs(refresh = false): Promise<TariffListResponse> {
  const query = refresh ? '?refresh=true' : '';
  const response = await fetch(`${API_PREFIX}/calculator/tariffs${query}`);
  return parseResponse<TariffListResponse>(response);
}

export async function fetchEstimate(
  items: EstimateRequestItem[],
  signal: AbortSignal,
): Promise<EstimateResponse> {
  const response = await fetch(`${API_PREFIX}/calculator/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
    signal,
  });

  return parseResponse<EstimateResponse>(response);
}
