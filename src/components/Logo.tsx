// Brand mark (spec §13): an open circle (the clock/shift) with a gold line
// breaking through its edge and extending upward as an arrow — "beyond the
// usual hours".
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M 28 16 A 12 12 0 1 1 20.5 4.9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M16 16 L26 4"
        stroke="#C9A227"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20.5 3.5 H26.5 V9.5"
        stroke="#C9A227"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${light ? "text-ivory" : "text-navy"}`}
    >
      <LogoMark />
      <span className="text-xl tracking-tight" style={{ fontWeight: 500 }}>
        Overtime
      </span>
    </span>
  );
}
