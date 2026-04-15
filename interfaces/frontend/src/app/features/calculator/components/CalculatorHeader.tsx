import { RefreshCcw, Server } from 'lucide-react';

import type { MobileTab } from '../types';

interface CalculatorHeaderProps {
  loading: boolean;
  refreshing: boolean;
  cartCount: number;
  mobileTab: MobileTab;
  onRefresh: () => void;
  onClearCart: () => void;
  onChangeMobileTab: (tab: MobileTab) => void;
}

export function CalculatorHeader({
  loading,
  refreshing,
  cartCount,
  mobileTab,
  onRefresh,
  onClearCart,
  onChangeMobileTab,
}: CalculatorHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-[#1f2430] bg-[#0e1016] px-5 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#2a4a78] bg-[#1a3358]">
          <Server size={14} className="text-[#4f90e8]" />
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase leading-none tracking-wider text-[#4d5568]">ГАУ РМ «Госинформ»</span>
          <span className="mt-0.5 text-sm leading-tight text-[#c8cdd8]">Калькулятор услуг дата-центра</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1 rounded border border-[#1e3055] bg-[#0f1a2a] px-2.5 py-1.5 text-xs text-[#5a9ae8] hover:bg-[#132040] disabled:opacity-50"
        >
          <RefreshCcw size={11} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Обновление...' : 'Обновить тарифы'}
        </button>

        {cartCount > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="rounded border border-[#1f2430] px-2.5 py-1.5 text-xs text-[#6b7480] hover:border-[#3d1a1a] hover:text-[#c85050]"
          >
            Очистить
          </button>
        )}

        <div className="flex overflow-hidden rounded border border-[#1f2430] md:hidden">
          <button
            onClick={() => onChangeMobileTab('services')}
            className={`px-3 py-1.5 text-xs transition-colors ${
              mobileTab === 'services'
                ? 'bg-[#1a3358] text-[#7fb3f5]'
                : 'bg-[#111418] text-[#6b7480] hover:text-[#aab0bc]'
            }`}
          >
            Услуги
          </button>

          <button
            onClick={() => onChangeMobileTab('summary')}
            className={`px-3 py-1.5 text-xs transition-colors ${
              mobileTab === 'summary'
                ? 'bg-[#1a3358] text-[#7fb3f5]'
                : 'bg-[#111418] text-[#6b7480] hover:text-[#aab0bc]'
            }`}
          >
            Итог
          </button>
        </div>
      </div>
    </header>
  );
}
