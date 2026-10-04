import { useRef } from 'react';

// Segmented one-time-code input: auto-advance, backspace, paste, SMS autofill.
export default function OtpInput({ length = 6, value, onChange, autoFocus, label = 'Verification code' }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');
  const set = (i, d) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, length));
  };
  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Digit ${i + 1}`}
          className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-lg border border-steel-300 bg-surface focus:outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/25 tabular"
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            if (v.length > 1) {
              onChange(v.slice(0, length));
              refs.current[Math.min(length - 1, v.length)]?.focus();
              return;
            }
            set(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (v) {
              e.preventDefault();
              onChange(v);
              refs.current[Math.min(length - 1, v.length - 1)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
