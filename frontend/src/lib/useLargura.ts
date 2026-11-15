import { useEffect, useRef, useState } from "react";

/** Mede a largura de um elemento e atualiza quando ela muda (gráficos responsivos). */
export function useLargura<T extends HTMLElement>(inicial = 640) {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(inicial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLargura(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, largura] as const;
}
