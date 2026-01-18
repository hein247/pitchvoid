import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const navItems = [
  { id: "challenge", label: "Challenge" },
  { id: "channels", label: "Channels" },
  { id: "styles", label: "Styles" },
  { id: "process", label: "Process" },
];

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/90 backdrop-blur-md border-b border-border" 
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="font-display text-lg text-foreground">
          Campaign Portfolio
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          Mejuri Test
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
