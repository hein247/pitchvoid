"use client"

import React, { useState, useEffect } from "react"
import { cva } from "class-variance-authority"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const orbitalLoaderVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface OrbitalLoaderProps {
  message?: string
  messages?: string[]
  messageInterval?: number
  messagePlacement?: "top" | "bottom" | "left" | "right"
  size?: "sm" | "md"
}

export function OrbitalLoader({
  className,
  message,
  messages,
  messageInterval = 2000,
  messagePlacement = "bottom",
  size = "md",
  ...props
}: React.ComponentProps<"div"> & OrbitalLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (!messages || messages.length <= 1) return
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, messageInterval)
    return () => clearInterval(interval)
  }, [messages, messageInterval])

  const displayMessage = messages ? messages[currentMessageIndex] : message

  const sizeClasses = size === "sm" ? "w-10 h-10" : "w-16 h-16"

  return (
    <div
      className={cn(orbitalLoaderVariants({ messagePlacement }), className)}
      {...props}
    >
      <div className={cn("relative", sizeClasses)}>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[3px] rounded-full border-2 border-transparent border-t-purple-500"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[8px] rounded-full border-2 border-purple-400/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {displayMessage && (
        <motion.p
          key={displayMessage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="text-[13px] font-sans"
          style={{ color: "rgba(240,237,246,0.4)", fontFamily: "'Be Vietnam Pro', sans-serif" }}
        >
          {displayMessage}
        </motion.p>
      )}
    </div>
  )
}
