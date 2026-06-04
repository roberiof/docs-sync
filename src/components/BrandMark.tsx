/** DocSync brand mark (matches app/icon.svg). Size it with `className`, e.g. size-8. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="DocSync">
      <defs>
        <linearGradient
          id="docsync-mark"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6e78ff" />
          <stop offset="1" stopColor="#2c39e0" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="8" fill="url(#docsync-mark)" />

      {/* centered document with folded corner + text lines */}
      <g
        transform="translate(5.2 5.2) scale(0.9)"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M8 13h8" />
        <path d="M8 17h8" />
        <path d="M8 9h2" />
      </g>
    </svg>
  );
}
