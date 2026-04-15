import { AlertCircle, Calculator, ClipboardList, Info, ReceiptText } from 'lucide-react';

import type { CartGroup, CartItem, EstimateResponse, MobileTab } from '../types';
import { formatRub } from '../utils';
import { CartRow } from './CartRow';

interface SummaryPaneProps {
  cart: CartItem[];
  groupedCart: CartGroup[];
  estimate: EstimateResponse;
  estimateLoading: boolean;
  estimateError: string | null;
  customCount: number;
  mobileTab: MobileTab;
  onRemoveItem: (itemUid: string) => void;
}

export function SummaryPane({
  cart,
  groupedCart,
  estimate,
  estimateLoading,
  estimateError,
  customCount,
  mobileTab,
  onRemoveItem,
}: SummaryPaneProps) {
  return (
    <div
      className={`flex w-full flex-col overflow-hidden md:w-2/5 ${
        mobileTab === 'services' ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="shrink-0 border-b border-[#1f2430] bg-[#0e1016] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ReceiptText size={13} className="text-[#4d5568]" />
          <span className="text-xs uppercase tracking-wider text-[#6b7480]">Итог</span>
          {estimateLoading && <span className="ml-auto text-[10px] text-[#4d5568]">Пересчёт...</span>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded border border-[#1f2430] bg-[#111418] p-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#4d5568]">Ежемесячно</div>
            <div className="text-sm text-[#dde1e8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatRub(estimate.monthly_total)}
            </div>
          </div>

          <div className="rounded border border-[#1f2430] bg-[#111418] p-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#4d5568]">Разово</div>
            <div className="text-sm text-[#dde1e8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatRub(estimate.one_time_total)}
            </div>
          </div>

          <div className="rounded border border-[#1f2430] bg-[#111418] p-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#4d5568]">Всего</div>
            <div className="text-sm text-[#dde1e8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatRub(estimate.grand_total)}
            </div>
          </div>
        </div>

        {customCount > 0 && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-[#7a6020]">
            <Info size={9} />
            {customCount} поз. по прайс-листу
          </div>
        )}

        {estimateError && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-[#c85050]">
            <AlertCircle size={9} />
            {estimateError}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1f2430] bg-[#111418]">
              <Calculator size={20} className="text-[#2a303a]" />
            </div>
            <p className="mb-1 text-sm text-[#3d4654]">Корзина пуста</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ClipboardList size={12} className="text-[#4d5568]" />
              <span className="text-[10px] uppercase tracking-wider text-[#4d5568]">Позиции расчёта</span>
              <span className="ml-auto text-[10px] text-[#3d4654]">{cart.length} поз.</span>
            </div>

            {groupedCart.map((group) => (
              <div key={group.id} className="mb-2">
                <div className="mb-1 px-1 text-[9px] uppercase tracking-wider text-[#3d4654]">{group.title}</div>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <CartRow key={item.uid} item={item} onRemove={onRemoveItem} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
