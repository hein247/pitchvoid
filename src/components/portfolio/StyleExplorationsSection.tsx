import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

import ringEditorialSilk from "@/assets/ring_editorial_silk.png";
import ringNatureStone from "@/assets/ring_nature_stone.png";
import ringModernConcrete from "@/assets/ring_modern_concrete.png";

const styleExplorations = [
  {
    id: "editorial",
    style: "Editorial",
    title: "Silk & Gold",
    description: "Luxurious silk fabric creates movement and softness, highlighting the ring's sculptural form.",
    image: ringEditorialSilk,
    mood: "Elevated • Sensual • Refined",
  },
  {
    id: "nature",
    style: "Nature",
    title: "Stone & Sun",
    description: "Natural stone surface with warm sunlight. Organic textures that ground the jewelry in earthiness.",
    image: ringNatureStone,
    mood: "Organic • Warm • Grounded",
  },
  {
    id: "modern",
    style: "Modern",
    title: "Concrete & Prism",
    description: "Architectural concrete with prismatic light effects. Contemporary edge meets timeless design.",
    image: ringModernConcrete,
    mood: "Bold • Architectural • Fresh",
  },
];

const StyleExplorationsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="styles" className="py-32 px-6 bg-muted/20" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6">
            Creative Exploration
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8">
            Style Variations
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Beyond channel requirements, exploring different aesthetic directions 
            that align with Mejuri's brand DNA.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {styleExplorations.map((style, index) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredId(style.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative overflow-hidden mb-6">
                <motion.img
                  src={style.image}
                  alt={style.title}
                  className="w-full aspect-[4/5] object-cover"
                  animate={{
                    scale: hoveredId === style.id ? 1.03 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 bg-foreground/0"
                  animate={{
                    backgroundColor: hoveredId === style.id ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-background border border-border px-3 py-1 text-xs tracking-[0.15em] uppercase text-foreground">
                    {style.style}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-2xl font-light text-foreground group-hover:text-muted-foreground transition-colors">
                  {style.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {style.description}
                </p>
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  {style.mood}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StyleExplorationsSection;
