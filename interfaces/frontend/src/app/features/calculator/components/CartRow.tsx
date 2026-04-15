import { X } from 'lucide-react';

import type { CartItem } from '../types';
import { buildTariffTitle, formatRub } from '../utils';
import { CustomPriceBadge } from './CustomPriceBadge';

interface CartRowProps {
  item: CartItem;
  onRemove: (itemUid: string) => void;
}

export function CartRow({ item, onRemove }: CartRowProps) {
  const lineTotal =
    item.tariff.price_type === 'numeric' && item.tariff.price_value !== null
      ? item.quantity * item.tariff.price_value
      : null;

  return (
    <div className="group flex items-start gap-2 rounded border border-[#1a1e27] bg-[#111418] px-2 py-2 transition-colors hover:border-[#232830]">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-1">
          <span className="text-[11px] leading-snug text-[#c8cdd8]">{buildTariffTitle(item.tariff)}</span>
          {item.tariff.price_type === 'external' && <CustomPriceBadge />}
        </div>

        <div className="mt-0.5 text-[9px] text-[#4d5568]">{item.tariff.section}</div>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-[#6b7480]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {item.quantity} {item.tariff.unit}
          </span>

          {lineTotal !== null ? (
            <span className="text-[10px] text-[#5a7fa8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatRub(lineTotal)} {item.tariff.billing_type === 'monthly' ? '/мес' : 'разово'}
            </span>
          ) : (
            <span className="text-[10px] text-[#7a6020]">по запросу</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onRemove(item.uid)}
        className="mt-0.5 shrink-0 rounded p-1 text-[#2a303a] opacity-0 transition-colors hover:bg-[#2a1515] hover:text-[#c85050] group-hover:opacity-100"
        aria-label="Удалить"
      >
        <X size={12} />
      </button>
    </div>
  );
}
