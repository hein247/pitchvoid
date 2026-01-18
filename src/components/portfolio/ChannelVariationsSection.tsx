import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

import ringEmailLinen from "@/assets/ring_email_linen.png";
import ringSocialLifestyle from "@/assets/ring_social_lifestyle.png";
import ringWebBanner from "@/assets/ring_web_banner.png";

const channelVariations = [
  {
    id: "email",
    channel: "Email",
    title: "Cozy Luxury",
    description: "Warm linen textures create an inviting, tactile feel perfect for email newsletters. The soft backdrop emphasizes the ring's golden warmth.",
    image: ringEmailLinen,
    specs: "600×800px • Hero Banner",
    rationale: "Email readers respond to warmth and comfort. The linen texture creates an intimate, gift-worthy presentation.",
  },
  {
    id: "social",
    channel: "Social",
    title: "Lifestyle POV",
    description: "First-person perspective in a coffee shop setting. Authentic, shareable moment that resonates with the Mejuri customer.",
    image: ringSocialLifestyle,
    specs: "1080×1080px • Instagram Feed",
    rationale: "POV shots drive engagement. The casual luxury of coffee + jewelry speaks to everyday elegance.",
  },
  {
    id: "web",
    channel: "Web",
    title: "Mirrored Hero",
    description: "Dramatic glass surface reflection creates depth and sophistication. Perfect for homepage hero placement with text overlay capability.",
    image: ringWebBanner,
    specs: "1920×800px • Hero Banner",
    rationale: "Web heroes need visual impact. The mirror effect adds dimension without competing with product focus.",
  },
];

const ChannelVariationsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <section id="channels" className="py-32 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Channel-Specific
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
            Tailored Variations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each variation is designed with the specific channel requirements and audience behavior in mind.
          </p>
        </motion.div>

        <div className="space-y-24">
          {channelVariations.map((variation, index) => (
            <motion.div
              key={variation.id}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
              onMouseEnter={() => setActiveCard(variation.id)}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className="relative overflow-hidden rounded-sm">
                  <motion.img
                    src={variation.image}
                    alt={variation.title}
                    className="w-full h-auto"
                    animate={{
                      scale: activeCard === variation.id ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-background/90 backdrop-blur-sm px-3 py-1 text-xs tracking-widest uppercase text-foreground rounded-sm">
                      {variation.channel}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${index % 2 === 1 ? "lg:order-1" : ""} space-y-6`}>
                <div>
                  <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">
                    {variation.specs}
                  </p>
                  <h3 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
                    {variation.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {variation.description}
                  </p>
                </div>

                <div className="border-l-2 border-accent pl-6">
                  <p className="text-sm text-muted-foreground italic">
                    <span className="font-medium text-foreground">Strategic Rationale:</span>{" "}
                    {variation.rationale}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChannelVariationsSection;
