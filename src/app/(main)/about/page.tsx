"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, Heart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const values = [
  { icon: Sparkles, title: "Quality First", desc: "We use premium materials for all our products." },
  { icon: Heart, title: "Made with Passion", desc: "Every design tells a story from Myanmar." },
  { icon: Shield, title: "Sustainable", desc: "Committed to eco-friendly practices." },
  { icon: Globe, title: "Proudly Myanmar", desc: "Celebrating local culture and creativity." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Our Story
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Wild Soul Club was born from the streets of Yangon, Myanmar — a brand for the bold, the free, and the wild at heart.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed">
              Founded in 2024, Wild Soul Club is a Myanmar streetwear brand that blends urban edge with 
              local soul. We believe fashion is more than clothing — it&apos;s an expression of identity.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Every piece in our collection is designed in-house, using premium materials sourced 
              responsibly. From the bustling streets of Yangon to the serene landscapes of Myanmar, 
              our inspiration comes from the world around us.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              We&apos;re not just a clothing brand — we&apos;re a community. A tribe of wild souls 
              who dare to be different. Join us on this journey.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <value.icon className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Tribe?</h2>
          <p className="text-muted-foreground mb-6">Explore our latest collection and find your style.</p>
          <Link href="/collections">
            <Button size="lg">Explore Collections</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
