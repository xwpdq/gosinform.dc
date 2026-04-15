export type BillingType = 'monthly' | 'one_time';
export type PriceType = 'numeric' | 'external';
export type MobileTab = 'services' | 'summary';

export interface TariffItem {
  tariff_id: string;
  section: string;
  service: string;
  parameter: string;
  unit: string;
  price_raw: string;
  price_value: number | null;
  price_type: PriceType;
  billing_type: BillingType;
}

export interface TariffListResponse {
  source_url: string;
  extracted_at: string;
  items: TariffItem[];
}

export interface EstimateRequestItem {
  code: string;
  title: string;
  billing_type: BillingType;
  quantity: number;
  unit_price: number;
}

export interface EstimateItemResult {
  code: string;
  title: string | null;
  billing_type: BillingType;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface EstimateResponse {
  currency: string;
  monthly_total: number;
  one_time_total: number;
  grand_total: number;
  items: EstimateItemResult[];
}

export interface CartItem {
  uid: string;
  tariff: TariffItem;
  quantity: number;
}

export interface SectionGroup {
  id: string;
  title: string;
  items: TariffItem[];
}

export interface CartGroup {
  id: string;
  title: string;
  items: CartItem[];
}

export interface RowInput {
  qty: string;
  error: string | null;
}
