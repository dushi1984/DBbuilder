"use client";

import { useEffect, useState } from "react";

export function ConfirmDelete({
  onConfirm,
  label = "Delete",
}: {
  onConfirm: () => void;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2600);
    return () => clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <button
        type="button"
        onClick={onConfirm}
        className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded border border-accent bg-accent px-2 text-xs font-medium text-white transition-colors hover:opacity-90"
      >
        {label}?
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-icon"
      title="Delete"
      aria-label="Delete"
      onClick={() => setArmed(true)}
    >
      <span className="flex items-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </span>
    </button>
  );
}
