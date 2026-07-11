"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function GmailLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/10",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" aria-hidden="true">
        <path
          d="M3 7 12 13.5 21 7"
          fill="none"
          stroke="#EA4335"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 7 12 13.5"
          fill="none"
          stroke="#4285F4"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M12 13.5 21 7"
          fill="none"
          stroke="#34A853"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function GoogleCalendarLogo({ className }: { className?: string }) {
  const clipId = useId();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/10",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[68%] w-[68%]" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect x="2.5" y="3.5" width="19" height="18" rx="2.5" />
          </clipPath>
        </defs>
        <rect x="6.6" y="1.6" width="1.5" height="3.8" rx="0.75" fill="#8AB4F8" />
        <rect x="15.9" y="1.6" width="1.5" height="3.8" rx="0.75" fill="#8AB4F8" />
        <rect x="2.5" y="3.5" width="19" height="18" rx="2.5" fill="#fff" stroke="#E1E1E1" />
        <g clipPath={`url(#${clipId})`}>
          <rect x="2.5" y="3.5" width="19" height="5.5" fill="#4285F4" />
        </g>
        <text
          x="12"
          y="18.3"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          fill="#3C4043"
          fontFamily="system-ui, sans-serif"
        >
          31
        </text>
      </svg>
    </div>
  );
}
