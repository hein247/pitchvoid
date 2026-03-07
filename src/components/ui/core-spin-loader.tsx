import React, { useState, useEffect } from 'react'

interface CoreSpinLoaderProps {
  texts?: string[];
}

export function CoreSpinLoader({ texts }: CoreSpinLoaderProps) {
  const defaultTexts = ['Loading...', 'Fetching Data...', 'Syncing...', 'Processing...', 'Optimizing...'];
  const states = texts || defaultTexts;
  const [loadingText, setLoadingText] = useState(states[0])

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % states.length
      setLoadingText(states[i])
    }, 1000)
    return () => clearInterval(interval)
  }, [states])

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-24 h-24">
        {/* Base Glow */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />

        {/* Outer Dashed Ring */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="hsl(var(--primary) / 0.15)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </svg>

        {/* Main Arc */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite]" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="80 170"
          />
        </svg>

        {/* Reverse Arc */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_2s_cubic-bezier(0.4,0,0.2,1)_infinite_reverse]" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="34"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="60 140"
          />
        </svg>

        {/* Inner Fast Ring */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_1s_linear_infinite]" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="28"
            fill="none"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="20 80"
          />
        </svg>

        {/* Orbital Dot */}
        <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
          />
        </div>

        {/* Center Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary/80 shadow-[0_0_16px_hsl(var(--primary)/0.5)] animate-pulse" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground tracking-wide animate-pulse">
          {loadingText}
        </p>
      </div>
    </div>
  )
}
