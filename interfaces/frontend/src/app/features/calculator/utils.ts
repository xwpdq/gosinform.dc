import { DEFAULT_ROW_INPUT } from './constants';
import type {
  CartGroup,
  CartItem,
  EstimateRequestItem,
  RowInput,
  SectionGroup,
  TariffItem,
} from './types';

export function createUid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}

export function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(value);
}

export function extractSectionId(section: string): string {
  const match = section.match(/^\s*(\d+)/);
  return match ? match[1] : section;
}

export function buildTariffTitle(tariff: TariffItem): string {
  return tariff.parameter ? `${tariff.service} — ${tariff.parameter}` : tariff.service;
}

export function inferMaxQty(tariff: TariffItem): number | undefined {
  const text = `${tariff.service} ${tariff.parameter}`.toLowerCase();
  const match = text.match(/не более\s*(\d+)/);
  if (!match) {
    return undefined;
  }

  const max = Number(match[1]);
  if (!Number.isFinite(max) || max < 1) {
    return undefined;
  }

  return max;
}

export function validateQty(raw: string, tariff: TariffItem): { value: number | null; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { value: null, error: 'Введите количество' };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return { value: null, error: 'Только числа' };
  }

  if (!Number.isInteger(value) || value < 1) {
    return { value: null, error: 'Целое число от 1' };
  }

  const max = inferMaxQty(tariff);
  if (max !== undefined && value > max) {
    return { value: null, error: `Максимум ${max}` };
  }

  return { value, error: null };
}

export function groupTariffsBySection(tariffs: TariffItem[]): SectionGroup[] {
  const sectionMap = new Map<string, SectionGroup>();

  for (const tariff of tariffs) {
    const sectionId = extractSectionId(tariff.section);
    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        id: sectionId,
        title: tariff.section,
        items: [],
      });
    }

    sectionMap.get(sectionId)?.items.push(tariff);
  }

  return Array.from(sectionMap.values());
}

export function groupCartBySection(cart: CartItem[]): CartGroup[] {
  const sectionMap = new Map<string, CartGroup>();

  for (const item of cart) {
    const sectionId = extractSectionId(item.tariff.section);
    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        id: sectionId,
        title: item.tariff.section,
        items: [],
      });
    }

    sectionMap.get(sectionId)?.items.push(item);
  }

  return Array.from(sectionMap.values());
}

export function getRowInputValue(rowInputs: Record<string, RowInput>, tariffId: string): RowInput {
  return rowInputs[tariffId] ?? DEFAULT_ROW_INPUT;
}

export function toEstimateItems(cart: CartItem[]): EstimateRequestItem[] {
  return cart.flatMap((item) => {
    if (item.tariff.price_type !== 'numeric' || item.tariff.price_value === null) {
      return [];
    }

    return [
      {
        code: item.tariff.tariff_id,
        title: buildTariffTitle(item.tariff),
        billing_type: item.tariff.billing_type,
        quantity: item.quantity,
        unit_price: item.tariff.price_value,
      },
    ];
  });
}

export function countExternalTariffs(cart: CartItem[]): number {
  return cart.filter((item) => item.tariff.price_type === 'external').length;
}
