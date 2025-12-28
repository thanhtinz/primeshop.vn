import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format large numbers to compact form
 * 1.000 -> 1K
 * 100.000 -> 100K  
 * 1.000.000 -> 1M
 * 1.000.000.000 -> 1B
 */
export function formatCompactNumber(num: number, currency: boolean = true): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const suffix = currency ? 'đ' : '';
  
  if (absNum >= 1_000_000_000) {
    const formatted = (absNum / 1_000_000_000).toFixed(absNum % 1_000_000_000 === 0 ? 0 : 1);
    return `${sign}${formatted.replace('.0', '')}B${suffix}`;
  }
  if (absNum >= 1_000_000) {
    const formatted = (absNum / 1_000_000).toFixed(absNum % 1_000_000 === 0 ? 0 : 1);
    return `${sign}${formatted.replace('.0', '')}M${suffix}`;
  }
  if (absNum >= 1_000) {
    const formatted = (absNum / 1_000).toFixed(absNum % 1_000 === 0 ? 0 : 1);
    return `${sign}${formatted.replace('.0', '')}K${suffix}`;
  }
  
  return `${sign}${absNum.toLocaleString('vi-VN')}${suffix}`;
}
