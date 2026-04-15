import type { EstimateResponse, RowInput } from './types';

export const API_PREFIX = '/api/v1';

export const DEFAULT_ROW_INPUT: RowInput = {
  qty: '1',
  error: null,
};

export const EMPTY_ESTIMATE: EstimateResponse = {
  currency: 'RUB',
  monthly_total: 0,
  one_time_total: 0,
  grand_total: 0,
  items: [],
};
