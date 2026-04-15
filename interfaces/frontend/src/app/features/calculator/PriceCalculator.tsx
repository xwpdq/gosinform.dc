import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_ROW_INPUT, EMPTY_ESTIMATE } from './constants';
import { fetchEstimate, fetchTariffs } from './api';
import { CalculatorHeader } from './components/CalculatorHeader';
import { SummaryPane } from './components/SummaryPane';
import { TariffPane } from './components/TariffPane';
import type { CartItem, MobileTab, RowInput, TariffItem } from './types';
import {
  countExternalTariffs,
  createUid,
  extractSectionId,
  getRowInputValue,
  groupCartBySection,
  groupTariffsBySection,
  inferMaxQty,
  toEstimateItems,
  validateQty,
} from './utils';

export function PriceCalculator() {
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [rowInputs, setRowInputs] = useState<Record<string, RowInput>>({});
  const [cart, setCart] = useState<CartItem[]>([]);

  const [estimate, setEstimate] = useState(EMPTY_ESTIMATE);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [mobileTab, setMobileTab] = useState<MobileTab>('services');

  const sections = useMemo(() => groupTariffsBySection(tariffs), [tariffs]);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [sections, activeSectionId],
  );

  const groupedCart = useMemo(() => groupCartBySection(cart), [cart]);
  const customCount = useMemo(() => countExternalTariffs(cart), [cart]);

  const setRowInput = useCallback((tariffId: string, patch: Partial<RowInput>) => {
    setRowInputs((prev) => ({
      ...prev,
      [tariffId]: {
        ...(prev[tariffId] ?? DEFAULT_ROW_INPUT),
        ...patch,
      },
    }));
  }, []);

  const loadTariffs = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setLoadError(null);

    try {
      const payload = await fetchTariffs(refresh);
      const nextTariffs = payload.items ?? [];

      setTariffs(nextTariffs);
      setActiveSectionId((current) => {
        if (current) {
          return current;
        }

        if (nextTariffs.length === 0) {
          return '';
        }

        return extractSectionId(nextTariffs[0].section);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setLoadError(`Не удалось загрузить тарифы: ${message}`);
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadTariffs();
  }, [loadTariffs]);

  useEffect(() => {
    if (sections.length > 0 && !sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  useEffect(() => {
    const estimateItems = toEstimateItems(cart);

    if (estimateItems.length === 0) {
      setEstimate(EMPTY_ESTIMATE);
      setEstimateLoading(false);
      setEstimateError(null);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setEstimateLoading(true);
      setEstimateError(null);

      try {
        const payload = await fetchEstimate(estimateItems, controller.signal);
        setEstimate(payload);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        setEstimateError(`Ошибка расчёта: ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setEstimateLoading(false);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [cart]);

  const handleQtyChange = useCallback(
    (tariff: TariffItem, raw: string) => {
      const sanitized = raw.replace(/[^0-9]/g, '');
      const { error } = validateQty(sanitized, tariff);
      setRowInput(tariff.tariff_id, {
        qty: sanitized,
        error: sanitized.length > 0 ? error : null,
      });
    },
    [setRowInput],
  );

  const handleQtyStep = useCallback(
    (tariff: TariffItem, direction: 1 | -1) => {
      const rowInput = getRowInputValue(rowInputs, tariff.tariff_id);
      const currentValue = Number(rowInput.qty || '1');
      const maxQty = inferMaxQty(tariff);

      let nextValue = Number.isFinite(currentValue) && currentValue > 0 ? currentValue + direction : 1;
      if (nextValue < 1) {
        nextValue = 1;
      }
      if (maxQty !== undefined) {
        nextValue = Math.min(maxQty, nextValue);
      }

      const nextRaw = String(nextValue);
      const { error } = validateQty(nextRaw, tariff);
      setRowInput(tariff.tariff_id, { qty: nextRaw, error });
    },
    [rowInputs, setRowInput],
  );

  const handleAdd = useCallback(
    (tariff: TariffItem) => {
      const rowInput = getRowInputValue(rowInputs, tariff.tariff_id);
      const { value, error } = validateQty(rowInput.qty, tariff);

      if (error || value === null) {
        setRowInput(tariff.tariff_id, { error: error ?? 'Ошибка ввода' });
        return;
      }

      setCart((prev) => [
        ...prev,
        {
          uid: createUid(),
          tariff,
          quantity: value,
        },
      ]);

      setRowInput(tariff.tariff_id, { qty: '1', error: null });
    },
    [rowInputs, setRowInput],
  );

  const handleRemove = useCallback((itemUid: string) => {
    setCart((prev) => prev.filter((item) => item.uid !== itemUid));
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0c0e12] text-[#dde1e8]">
      <CalculatorHeader
        loading={loading}
        refreshing={refreshing}
        cartCount={cart.length}
        mobileTab={mobileTab}
        onRefresh={() => void loadTariffs(true)}
        onClearCart={() => setCart([])}
        onChangeMobileTab={setMobileTab}
      />

      <div className="flex flex-1 overflow-hidden">
        <TariffPane
          sections={sections}
          activeSection={activeSection}
          loading={loading}
          loadError={loadError}
          mobileTab={mobileTab}
          rowInputs={rowInputs}
          onSectionChange={setActiveSectionId}
          onQtyChange={handleQtyChange}
          onQtyStep={handleQtyStep}
          onAdd={handleAdd}
        />

        <SummaryPane
          cart={cart}
          groupedCart={groupedCart}
          estimate={estimate}
          estimateLoading={estimateLoading}
          estimateError={estimateError}
          customCount={customCount}
          mobileTab={mobileTab}
          onRemoveItem={handleRemove}
        />
      </div>
    </div>
  );
}
