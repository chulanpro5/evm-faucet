import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-6", className)}
      aria-label="EVM Faucet"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary/10" />
      {/* Faucet tap body */}
      <rect x="6" y="10" width="14" height="7" rx="2" fill="currentColor" className="text-foreground" />
      {/* Spout turning down */}
      <rect x="17" y="14" width="6" height="3" rx="1.5" fill="currentColor" className="text-foreground" />
      <rect x="20" y="15" width="3" height="6" rx="1.5" fill="currentColor" className="text-foreground" />
      {/* Water drop */}
      <path
        d="M21.5 24 C21.5 24 19 20.5 19 22.5 C19 23.88 20.12 25 21.5 25 C22.88 25 24 23.88 24 22.5 C24 20.5 21.5 24 21.5 24Z"
        fill="#60a5fa"
        opacity="0.9"
      />
      {/* Handle knob */}
      <rect x="10" y="7" width="4" height="4" rx="1" fill="currentColor" className="text-foreground" />
    </svg>
  )
}
