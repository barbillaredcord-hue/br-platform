"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const INTRO_SESSION_KEY = "br-brand-intro-seen-v1";

export function BrandIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1") {
        return;
      }

      window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      // La intro sigue funcionando si el navegador bloquea sessionStorage.
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setIsVisible(false), reduceMotion ? 360 : 900);

    return () => window.clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="brand-intro" aria-hidden="true">
      <div className="brand-intro__mark">
        <Image
          src="/brand/br-platform-icon-512.png"
          alt=""
          width={160}
          height={160}
          priority
          sizes="160px"
        />
      </div>
    </div>
  );
}
