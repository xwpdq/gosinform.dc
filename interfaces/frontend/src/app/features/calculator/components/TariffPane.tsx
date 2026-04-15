import { AlertCircle, Plus } from 'lucide-react';

import { DEFAULT_ROW_INPUT } from '../constants';
import type { MobileTab, RowInput, SectionGroup, TariffItem } from '../types';
import { formatRub, inferMaxQty } from '../utils';
import { CustomPriceBadge } from './CustomPriceBadge';
import { QtyInput } from './QtyInput';

interface TariffPaneProps {
  sections: SectionGroup[];
  activeSection: SectionGroup | undefined;
  loading: boolean;
  loadError: string | null;
  mobileTab: MobileTab;
  rowInputs: Record<string, RowInput>;
  onSectionChange: (sectionId: string) => void;
  onQtyChange: (tariff: TariffItem, rawValue: string) => void;
  onQtyStep: (tariff: TariffItem, direction: 1 | -1) => void;
  onAdd: (tariff: TariffItem) => void;
}

function renderTariffPrice(tariff: TariffItem) {
  if (tariff.price_type === 'external' || tariff.price_value === null) {
    return <CustomPriceBadge />;
  }

  return (
    <span className="text-xs text-[#c8cdd8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatRub(tariff.price_value)}
      <span className="text-[#4d5568]">/{tariff.billing_type === 'monthly' ? 'мес' : 'ед.'}</span>
    </span>
  );
}

export function TariffPane({
  sections,
  activeSection,
  loading,
  loadError,
  mobileTab,
  rowInputs,
  onSectionChange,
  onQtyChange,
  onQtyStep,
  onAdd,
}: TariffPaneProps) {
  const selectedSectionId = activeSection?.id ?? '';

  return (
    <div
      className={`flex w-full flex-col overflow-hidden border-r border-[#1f2430] md:w-3/5 ${
        mobileTab === 'summary' ? 'hidden md:flex' : 'flex'
      }`}
    >
      <nav className="flex shrink-0 gap-0 overflow-x-auto border-b border-[#1f2430] bg-[#0e1016] px-4">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs transition-colors ${
              selectedSectionId === section.id
                ? 'border-[#3e7ed4] bg-[#0f1925] text-[#7fb3f5]'
                : 'border-transparent text-[#6b7480] hover:bg-[#13161c] hover:text-[#aab0bc]'
            }`}
          >
            {section.title}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-sm text-[#6b7480]">Загрузка тарифов...</div>
        ) : loadError ? (
          <div className="flex items-center gap-2 p-6 text-sm text-[#c85050]">
            <AlertCircle size={14} />
            {loadError}
          </div>
        ) : !activeSection ? (
          <div className="p-6 text-sm text-[#6b7480]">Тарифы не найдены.</div>
        ) : (
          <>
            <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto] gap-x-3 border-b border-[#1a1e27] px-4 py-2 text-[10px] uppercase tracking-wider text-[#4d5568] lg:grid">
              <span>Услуга</span>
              <span>Параметр</span>
              <span className="text-right">Количество</span>
              <span className="text-right">Стоимость</span>
              <span />
            </div>

            {activeSection.items.map((tariff) => {
              const rowInput = rowInputs[tariff.tariff_id] ?? DEFAULT_ROW_INPUT;
              const maxQty = inferMaxQty(tariff);

              return (
                <div
                  key={tariff.tariff_id}
                  className="flex flex-col gap-x-3 gap-y-1.5 border-b border-[#1a1e27] px-4 py-2.5 hover:bg-[#111820] lg:grid lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-center lg:gap-y-0"
                >
                  <div className="text-xs leading-snug text-[#c8cdd8]">{tariff.service}</div>

                  <div className="text-xs leading-snug text-[#8a92a0]">
                    {tariff.parameter || '—'}
                    <span className="ml-1 text-[#4d5568]">({tariff.unit})</span>
                    {maxQty !== undefined && (
                      <div className="mt-0.5 text-[10px] text-[#6b7480]">Ограничение: не более {maxQty}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-0.5 pl-0 lg:items-end">
                    <div className="flex items-center gap-1.5">
                      <QtyInput
                        value={rowInput.qty}
                        error={rowInput.error}
                        onChange={(value) => onQtyChange(tariff, value)}
                        onStep={(direction) => onQtyStep(tariff, direction)}
                      />
                      <span className="min-w-[28px] whitespace-nowrap text-[10px] text-[#4d5568]">{tariff.unit}</span>
                    </div>

                    {rowInput.error && (
                      <span className="flex items-center gap-1 text-[10px] text-[#c85050]">
                        <AlertCircle size={9} />
                        {rowInput.error}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-start lg:justify-end">{renderTariffPrice(tariff)}</div>

                  <div className="flex justify-start lg:justify-end">
                    <button
                      type="button"
                      onClick={() => onAdd(tariff)}
                      className={`flex items-center gap-1 rounded border px-2.5 py-1.5 text-[11px] transition-all ${
                        tariff.price_type === 'external'
                          ? 'border-[#3a2e14] bg-[#1e1a0c] text-[#c49a30] hover:border-[#5a4a20] hover:bg-[#2a2210]'
                          : 'border-[#1e3055] bg-[#0f1a2a] text-[#5a9ae8] hover:border-[#2e5080] hover:bg-[#132040] hover:text-[#7fb3f5]'
                      }`}
                    >
                      <Plus size={11} />
                      {tariff.price_type === 'external' ? 'Запрос' : 'Добавить'}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
