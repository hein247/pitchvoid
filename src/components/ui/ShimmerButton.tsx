import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ShimmerButton = ({ children, className, onClick }: ShimmerButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden h-14 px-10 uppercase tracking-[0.15em] text-sm font-medium",
        "bg-gradient-to-r from-void-purple via-void-blue to-void-purple bg-[length:200%_100%]",
        "text-white rounded-none",
        "transition-all duration-300 ease-out",
        "hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]",
        className
      )}
    >
      {/* Shimmer effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1,
        }}
      />
      
      {/* Border shimmer */}
      <div className="absolute inset-0 rounded-none">
        <motion.div
          className="absolute inset-[-2px] rounded-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            backgroundSize: '200% 100%',
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
      </div>
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

export default ShimmerButton;
