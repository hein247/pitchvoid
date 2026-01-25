import { motion } from "framer-motion";
// ShimmerButton with Electric Magenta & Deep Violet gradient
import { cn } from "@/lib/utils";

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

const ShimmerButton = ({ children, className, onClick, variant = "primary" }: ShimmerButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden h-14 px-10 uppercase tracking-[0.15em] text-sm font-medium font-sans",
        variant === "primary" && [
          "bg-gradient-to-r from-electric-magenta via-deep-violet to-electric-magenta",
          "bg-[length:200%_100%]",
        ],
        variant === "secondary" && [
          "bg-card",
          "border border-border",
        ],
        "text-primary-foreground",
        "transition-all duration-300 ease-out",
        // Electric Magenta & Deep Violet glow on hover
        "hover:shadow-[0_0_50px_hsl(var(--electric-magenta)/0.5),0_0_20px_hsl(var(--deep-violet)/0.3)]",
        className
      )}
    >
      {/* Shimmer metallic effect overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%)',
        }}
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 0.5,
        }}
      />
      
      {/* Border shimmer effect */}
      <motion.div
        className="absolute inset-[-1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2 font-medium">
        {children}
      </span>
    </motion.button>
  );
};

export default ShimmerButton;
