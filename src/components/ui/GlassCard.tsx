import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative p-8",
          "bg-white/[0.03] backdrop-blur-xl",
          "border border-white/[0.08]",
          hover && "hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)]",
          "transition-all duration-300 ease-out",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
