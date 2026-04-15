import { Info } from 'lucide-react';

export function CustomPriceBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-[#4a3510] bg-[#2e2212] px-1.5 py-0.5 text-[10px] text-[#d4a843]">
      <Info size={9} />
      согласно прайс-листа
    </span>
  );
}
