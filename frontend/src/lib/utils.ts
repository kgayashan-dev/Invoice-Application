// Provides shared utils helpers used by frontend features.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Performs cn for this feature.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
