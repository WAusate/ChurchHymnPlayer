import { useEffect, useState } from "react";

type Props = {
  onFinish?: () => void;
  holdMs?: number;   // tempo do EQ sozinho (default 3200ms)
  xfadeMs?: number;  // duração do slide/fade (default 950ms)
  logoHoldMs?: number; // tempo extra que a logo permanece (default 2000ms)
};

export default function SplashScreen({
  onFinish,
  holdMs = 3200,
  xfadeMs = 950,
  logoHoldMs = 1000, // << ajuste aqui o tempo extra da logo
}: Props) {
  // Ajustes finos (px). +X direita; +Y baixo.
  const ajusteX = 0;
  const ajusteY = 0;
  const slideDx = 140;

  const [slideOut, setSlideOut] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // inicia transição: EQ sai e logo entra
    const t1 = setTimeout(() => {
      setSlideOut(true);
      setShowLogo(true);
    }, holdMs);

    // termina splash depois da transição + tempo extra da logo
    const t2 = setTimeout(() => {
      onFinish?.();
    }, holdMs + xfadeMs + logoHoldMs);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [holdMs, xfadeMs, logoHoldMs, onFinish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg,#0a2a59,#0f4e98)",
      }}
    >
      {/* CSS crítico inline pra não depender de index.css */}
      <style>{`
        @keyframes sp_eqCenter{
          0%   { transform: scaleY(var(--sp-a0)); }
          25%  { transform: scaleY(var(--sp-a1)); }
          50%  { transform: scaleY(var(--sp-a2)); }
          75%  { transform: scaleY(var(--sp-a3)); }
          100% { transform: scaleY(var(--sp-a0)); }
        }
      `}</style>

      <div style={{ position: "relative", width: "min(92vw, 900px)", height: "min(60vh, 520px)" }}>
        {/* === EQUALIZADOR === */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            transform: `translate(${ajusteX}px, ${ajusteY}px) ${slideOut ? ` translateX(${slideDx}px)` : ""}`,
            transition: `transform ${xfadeMs}ms ease, opacity ${xfadeMs}ms ease, filter ${xfadeMs}ms ease`,
            opacity: slideOut ? 0 : 1,
            filter: slideOut ? "blur(4px)" : "none",
          }}
        >
          {/* halo */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: -1,
              opacity: 0.22,
              background: "radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,.45), transparent 60%)",
              filter: "blur(18px)",
            }}
          />
          {/* barras */}
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              height: 70,
              filter: "drop-shadow(0 12px 30px rgba(0,0,0,.25))",
            }}
          >
            {[
              { h: 80,  delay: 0.00, amp:.45 },
              { h: 140, delay: 0.15, amp:.95 },
              { h: 110, delay: 0.30, amp:.70 },
              { h: 90,  delay: 0.45, amp:.80 },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  width: 9,
                  height: b.h,
                  borderRadius: 999,
                  background: "linear-gradient(180deg,#05d7ff,#34c17d)",
                  boxShadow: "0 6px 24px rgba(0,0,0,.25), inset 0 0 18px rgba(5,215,255,.15)",
                  transformOrigin: "center",
                  ["--sp-a0" as any]: `calc(.70 + ${b.amp}*.05)`,
                  ["--sp-a1" as any]: `calc(.95 + ${b.amp}*.35)`,
                  ["--sp-a2" as any]: `calc(1.15 + ${b.amp}*.20)`,
                  ["--sp-a3" as any]: `calc(.90 + ${b.amp}*.30)`,
                  animation: `sp_eqCenter 1.1s ease-in-out ${b.delay}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* === LOGO === */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? "scale(1)" : "scale(0.985)",
            transition: `opacity ${xfadeMs}ms ease, transform ${xfadeMs}ms ease`,
          }}
        >
          <img
            src="/logo.png"
            alt="Belém Play"
            style={{
              display: "block",
              width: "clamp(234px, 40vmin, 540px)",
              height: "auto",
              filter: "drop-shadow(0 10px 22px rgba(0,0,0,.25))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
