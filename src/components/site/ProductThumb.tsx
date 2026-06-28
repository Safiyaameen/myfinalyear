export function ProductThumb({ hue, label, className = "" }: { hue: number; label: string; className?: string }) {
  const bg = `oklch(0.92 0.06 ${hue})`;
  const fg = `oklch(0.45 0.13 ${hue})`;
  const ring = `oklch(0.75 0.12 ${hue})`;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${bg}, oklch(0.98 0.02 ${hue}))` }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 70% 30%, ${ring}, transparent 55%)`,
        }}
      />
      <span
        className="relative z-10 text-center text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: fg }}
      >
        {label}
      </span>
    </div>
  );
}
