import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = true, glow = true }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.01 } : undefined}
        className={cn(
          "relative p-8",
          // Glassmorphism: 5% opacity white, 10px backdrop-blur, 1px border
          "bg-[rgba(255,255,255,0.05)] backdrop-blur-[10px]",
          "border border-[rgba(255,255,255,0.1)]",
          // Hover glow effect
          hover && [
            "transition-all duration-300 ease-out",
            "hover:bg-[rgba(255,255,255,0.08)]",
            "hover:border-[rgba(255,255,255,0.15)]",
            glow && "hover:shadow-[0_0_40px_rgba(139,92,246,0.15),0_8px_32px_rgba(0,0,0,0.3)]",
          ],
          className
        )}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;