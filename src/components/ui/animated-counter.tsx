// src/components/ui/animated-counter.tsx

"use client";

import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  separator?: string;
}

export default function AnimatedCounter({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  suffix = "",
  prefix = "",
  separator = ",",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(start);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setHasAnimated(true);
      }
    };

    requestAnimationFrame(step);
  }, [start, end, duration, hasAnimated]);

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals);
    if (separator && Math.abs(num) >= 1000) {
      return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }
    return fixed;
  };

  return (
    <span>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
