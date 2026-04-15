import { Minus, Plus } from 'lucide-react';

interface QtyInputProps {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onStep: (direction: 1 | -1) => void;
}

export function QtyInput({ value, error, onChange, onStep }: QtyInputProps) {
  return (
    <div className="flex items-center gap-0">
      <button
        type="button"
        onClick={() => onStep(-1)}
        className="flex h-7 w-7 items-center justify-center rounded-l border border-[#252b34] bg-[#181b21] text-[#8a92a0] transition-colors hover:bg-[#1e2229] hover:text-[#dde1e8]"
        aria-label="Уменьшить"
      >
        <Minus size={11} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="1"
        className={`h-7 w-16 border-y border-[#252b34] bg-[#111418] text-center text-sm text-[#dde1e8] outline-none transition-colors placeholder:text-[#4d5568] ${
          error ? 'border-[#c85050] bg-[#2a1515]' : 'focus:border-[#3e7ed4] focus:bg-[#0e1623]'
        }`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      />

      <button
        type="button"
        onClick={() => onStep(1)}
        className="flex h-7 w-7 items-center justify-center rounded-r border border-[#252b34] bg-[#181b21] text-[#8a92a0] transition-colors hover:bg-[#1e2229] hover:text-[#dde1e8]"
        aria-label="Увеличить"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}
