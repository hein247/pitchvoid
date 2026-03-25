import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

import ringEmailLinen from "@/assets/ring_email_linen.png";
import ringSocialLifestyle from "@/assets/ring_social_lifestyle.png";
import ringWebBanner from "@/assets/ring_web_banner.png";
import ringModernConcrete from "@/assets/ring_modern_concrete.png";
// Email Mockup Component
const EmailMockup = ({ image }: { image: string }) => (
  <div className="bg-muted rounded-lg shadow-2xl overflow-hidden max-w-md mx-auto">
    {/* Email client header */}
    <div className="bg-secondary px-4 py-3 flex items-center gap-2 border-b border-border">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-destructive/60" />
        <div className="w-3 h-3 rounded-full bg-accent" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
      </div>
      <div className="flex-1 text-center">
        <span className="text-xs text-muted-foreground">mejuri.com</span>
      </div>
    </div>
    {/* Email header */}
    <div className="bg-card px-6 py-4 border-b border-border">
      <p className="text-xs text-muted-foreground mb-1">From: Mejuri &lt;hello@mejuri.com&gt;</p>
      <p className="text-sm font-medium text-foreground">Introducing the Dôme Figure Ring ✨</p>
    </div>
    {/* Email content */}
    <div className="bg-card">
      <img src={image} alt="Email hero" className="w-full" />
      <div className="p-6 text-center space-y-4">
        <h3 className="font-display text-xl text-foreground">Cozy Luxury Awaits</h3>
        <p className="text-sm text-muted-foreground">The new Dôme Figure Ring // sculptural elegance for everyday.</p>
        <button className="bg-foreground text-background px-6 py-2 text-sm tracking-wide">
          SHOP NOW
        </button>
      </div>
    </div>
  </div>
);

// Phone Mockup Component for Social
const PhoneMockup = ({ image }: { image: string }) => (
  <div className="relative mx-auto" style={{ width: "280px" }}>
    {/* Phone frame */}
    <div className="bg-foreground rounded-[3rem] p-2 shadow-2xl">
      <div className="bg-background rounded-[2.5rem] overflow-hidden">
        {/* Notch */}
        <div className="bg-foreground h-7 flex items-center justify-center">
          <div className="w-20 h-5 bg-foreground rounded-b-xl" />
        </div>
        {/* Screen content - Instagram style */}
        <div className="bg-card">
          {/* IG Header */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-bold">M</span>
            </div>
            <span className="text-sm font-medium text-foreground">mejuri</span>
            <span className="text-xs text-muted-foreground ml-auto">•••</span>
          </div>
          {/* Image */}
          <img src={image} alt="Social post" className="w-full aspect-square object-cover" />
          {/* IG Actions */}
          <div className="px-3 py-2 flex items-center gap-4">
            <span className="text-lg">♡</span>
            <span className="text-lg">💬</span>
            <span className="text-lg">↗</span>
            <span className="text-lg ml-auto">⊡</span>
          </div>
          <div className="px-3 pb-3">
            <p className="text-xs"><span className="font-medium">mejuri</span> The Dôme Figure Ring // your new everyday essential ✨</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Browser/Web Mockup Component
const BrowserMockup = ({ image }: { image: string }) => (
  <div className="bg-secondary rounded-lg shadow-2xl overflow-hidden max-w-4xl mx-auto">
    {/* Browser header */}
    <div className="bg-muted px-4 py-3 flex items-center gap-3 border-b border-border">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-destructive/60" />
        <div className="w-3 h-3 rounded-full bg-accent" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
      </div>
      <div className="flex-1 bg-card rounded-md px-4 py-1.5 text-center">
        <span className="text-xs text-muted-foreground">https://mejuri.com/collections/rings</span>
      </div>
    </div>
    {/* Website content */}
    <div className="bg-card">
      {/* Nav bar */}
      <div className="px-8 py-4 flex items-center justify-between border-b border-border">
        <span className="font-display text-lg text-foreground tracking-wider">MEJURI</span>
        <div className="flex gap-6 text-xs text-muted-foreground tracking-wide">
          <span>NEW</span>
          <span>EARRINGS</span>
          <span className="text-foreground font-medium">RINGS</span>
          <span>NECKLACES</span>
        </div>
        <div className="flex gap-4 text-sm">
          <span>🔍</span>
          <span>♡</span>
          <span>👤</span>
        </div>
      </div>
      {/* Hero banner */}
      <div className="relative">
        <img src={image} alt="Web hero banner" className="w-full aspect-[21/9] object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
          <div className="text-center text-background">
            <h2 className="font-display text-4xl mb-4 drop-shadow-lg">Dôme Figure Ring</h2>
            <p className="text-sm mb-6 drop-shadow">Sculptural elegance, everyday wear</p>
            <button className="bg-background text-foreground px-8 py-3 text-sm tracking-widest hover:bg-background/90 transition-colors">
              SHOP THE COLLECTION
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// In-Store Display Mockup Component
const StoreMockup = ({ image }: { image: string }) => (
  <div className="relative mx-auto max-w-3xl">
    {/* Store environment */}
    <div className="bg-gradient-to-b from-secondary to-muted rounded-2xl p-8 shadow-2xl">
      {/* Ceiling lights */}
      <div className="flex justify-center gap-16 mb-8">
        <div className="w-2 h-8 bg-accent/30 rounded-full shadow-lg shadow-accent/20" />
        <div className="w-2 h-8 bg-accent/30 rounded-full shadow-lg shadow-accent/20" />
        <div className="w-2 h-8 bg-accent/30 rounded-full shadow-lg shadow-accent/20" />
      </div>
      
      {/* Display case */}
      <div className="bg-card rounded-xl p-6 shadow-inner border border-border">
        {/* Glass top effect */}
        <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted">
          {/* Display image */}
          <img 
            src={image} 
            alt="In-store display" 
            className="w-full aspect-[16/10] object-cover"
          />
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>
        
        {/* Product info card */}
        <div className="mt-4 flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
          <div>
            <p className="font-display text-sm text-foreground tracking-wide">Dôme Figure Ring</p>
            <p className="text-xs text-muted-foreground">14K Gold Vermeil</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">$148</p>
            <p className="text-xs text-accent">In Stock</p>
          </div>
        </div>
      </div>
      
      {/* Store branding footer */}
      <div className="mt-6 text-center">
        <span className="font-display text-xs tracking-[0.4em] text-muted-foreground">MEJURI</span>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Fine Jewelry • Est. 2015</p>
      </div>
    </div>
  </div>
);

const channelVariations = [
  {
    id: "email",
    channel: "Email",
    title: "Cozy Luxury",
    description: "Warm linen textures create an inviting, tactile feel perfect for email newsletters. The soft backdrop emphasizes the ring's golden warmth.",
    image: ringEmailLinen,
    specs: "600×800px • Hero Banner",
    rationale: "Email readers respond to warmth and comfort. The linen texture creates an intimate, gift-worthy presentation.",
    MockupComponent: EmailMockup,
  },
  {
    id: "social",
    channel: "Social",
    title: "Lifestyle POV",
    description: "First-person perspective in a coffee shop setting. Authentic, shareable moment that resonates with the Mejuri customer.",
    image: ringSocialLifestyle,
    specs: "1080×1080px • Instagram Feed",
    rationale: "POV shots drive engagement. The casual luxury of coffee + jewelry speaks to everyday elegance.",
    MockupComponent: PhoneMockup,
  },
  {
    id: "web",
    channel: "Web",
    title: "Mirrored Hero",
    description: "Dramatic glass surface reflection creates depth and sophistication. Perfect for homepage hero placement with text overlay capability.",
    image: ringWebBanner,
    specs: "1920×800px • Hero Banner",
    rationale: "Web heroes need visual impact. The mirror effect adds dimension without competing with product focus.",
    MockupComponent: BrowserMockup,
  },
  {
    id: "instore",
    channel: "In-Store",
    title: "Modern Concrete",
    description: "Clean architectural backdrop that lets the product shine. Designed for in-store displays and visual merchandising materials.",
    image: ringModernConcrete,
    specs: "1200×750px • Display Signage",
    rationale: "Retail environments need bold, clean visuals. The concrete texture adds premium weight while maintaining focus.",
    MockupComponent: StoreMockup,
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
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6">
            Channel-Specific
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8">
            Tailored Variations
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Each variation is designed with the specific channel requirements and audience behavior in mind.
          </p>
        </motion.div>

        <div className="space-y-32">
          {channelVariations.map((variation, index) => (
            <motion.div
              key={variation.id}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="space-y-12"
              onMouseEnter={() => setActiveCard(variation.id)}
              onMouseLeave={() => setActiveCard(null)}
            >
              {/* Mockup */}
              <motion.div
                animate={{
                  scale: activeCard === variation.id ? 1.01 : 1,
                }}
                transition={{ duration: 0.4 }}
              >
                <variation.MockupComponent image={variation.image} />
              </motion.div>

              {/* Info below mockup */}
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <span className="bg-background border border-foreground px-3 py-1 text-xs tracking-[0.15em] uppercase text-foreground">
                    {variation.channel}
                  </span>
                  <span className="text-sm text-muted-foreground">{variation.specs}</span>
                </div>
                
                <h3 className="font-display text-3xl md:text-4xl font-light text-foreground">
                  {variation.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {variation.description}
                </p>

                <div className="inline-block border-l border-foreground pl-4 text-left mt-4">
                  <p className="text-sm text-muted-foreground">
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
