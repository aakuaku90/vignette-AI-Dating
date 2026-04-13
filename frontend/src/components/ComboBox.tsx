"use client";

import { useState, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";

interface ComboBoxProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  type?: string;
}

export default function ComboBox({ placeholder, value, onChange, options, type }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  return (
    <Popover.Root open={open && filtered.length > 0} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="relative">
          <input
            ref={inputRef}
            type={type || "text"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="input-field pr-10"
          />
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 w-[var(--radix-popover-trigger-width)] max-h-52 overflow-y-auto rounded-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          style={{
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="py-1">
            {filtered.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setOpen(false);
                  inputRef.current?.blur();
                }}
                className="w-full text-left px-4 py-2.5 text-[15px] text-zinc-800 transition-colors rounded-lg mx-0"
                style={{
                  margin: "0 4px",
                  width: "calc(100% - 8px)",
                  borderRadius: "8px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0, 0, 0, 0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
