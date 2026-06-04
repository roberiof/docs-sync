import { PenLine } from "lucide-react";

/** Decorative collaborator cursor: pointer + name pill. */
function Cursor({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <div className={`pointer-events-none absolute flex items-start gap-1 ${className ?? ""}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 3l14 7-6 1.6L9.7 18 5 3z"
          fill={color}
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="-mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

/** Faux skeleton line in the live-document card. */
function Line({ w, className }: { w: string; className?: string }) {
  return (
    <span
      className={`bg-ultramarine-200/80 block h-2.5 rounded-full ${className ?? ""}`}
      style={{ width: w }}
    />
  );
}

const collaborators = [
  { name: "Marina", color: "#10b981" },
  { name: "Theo", color: "#fb9084" },
  { name: "Ana", color: "#9299f9" },
];

export function AuthBrandPanel() {
  return (
    <aside className="grain bg-ultramarine-500 relative hidden overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12 xl:p-16">
      {/* atmosphere */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(120% 120% at 0% 0%, #5b66ff 0%, #3946f4 38%, #1c237a 100%)",
        }}
      />
      <div className="blob bg-ultramarine-300/40 absolute top-10 -left-24 -z-10 h-80 w-80 rounded-full blur-3xl" />
      <div className="blob absolute right-0 -bottom-24 -z-10 h-96 w-96 rounded-full bg-[#6e78ff]/40 blur-3xl [animation-delay:-6s]" />

      {/* vertically + horizontally centered content cluster */}
      <div className="relative flex w-full max-w-md flex-col gap-9">
        {/* wordmark */}
        <div className="auth-rise flex items-center gap-2.5 text-white">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <PenLine className="size-4.5" strokeWidth={2.2} />
          </span>
          <span className="font-serif text-2xl tracking-tight">DocSync</span>
        </div>

        {/* headline */}
        <div>
          <h1 className="auth-rise font-serif text-[2.7rem] leading-[1.05] tracking-tight text-white [animation-delay:80ms] xl:text-5xl">
            Write <span className="text-ultramarine-200 italic">together</span>,<br />
            in real time.
          </h1>
          <p className="auth-rise mt-5 max-w-sm text-[15px] leading-relaxed text-white/70 [animation-delay:160ms]">
            Collaborative documents with live cursors, autosave, and an AI assistant that writes
            with you.
          </p>
        </div>

        {/* floating live-document card */}
        <div className="auth-rise relative max-w-md [animation-delay:260ms]">
          <Cursor name="Marina" color="#10b981" className="cursor-a top-16 right-3 z-10" />
          <Cursor name="Theo" color="#fb9084" className="cursor-b bottom-10 left-8 z-10" />

          <div className="rounded-2xl bg-white p-6 shadow-[0_30px_60px_-20px_rgba(8,12,45,0.5)] ring-1 ring-black/5">
            <div className="mb-4 flex items-center gap-1.5">
              <span className="bg-ultramarine-200 size-2.5 rounded-full" />
              <span className="bg-ultramarine-200 size-2.5 rounded-full" />
              <span className="bg-ultramarine-200 size-2.5 rounded-full" />
            </div>
            <p className="text-foreground font-serif text-lg">2026 Benefits Proposal</p>
            <div className="mt-4 space-y-2.5">
              <Line w="100%" />
              <Line w="86%" />
              <Line w="92%" />
              <div className="flex items-center gap-1">
                <Line w="48%" />
                <span className="auth-caret bg-ultramarine-500 inline-block h-4 w-0.5 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="auth-rise flex items-center gap-3 text-white/70 [animation-delay:340ms]">
          <div className="flex -space-x-2">
            {collaborators.map((p) => (
              <span
                key={p.name}
                title={p.name}
                className="ring-ultramarine-500 flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2"
                style={{ backgroundColor: p.color }}
              >
                {p.name[0]}
              </span>
            ))}
          </div>
          <span className="text-[13px]">3 people editing now</span>
        </div>
      </div>
    </aside>
  );
}
