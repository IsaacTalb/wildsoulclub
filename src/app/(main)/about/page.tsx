"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-white py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Our Story
          </h1>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Wild Soul Club was born from the streets of Yangon, Myanmar — a brand for the bold, the free, and the wild at heart.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-neutral max-w-none">
            <p className="text-lg leading-relaxed">
              Founded in 2023, Wild Soul Club is a Myanmar streetwear brand that blends urban edge with 
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

      {/*Contact */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-neutral max-w-none">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">Yangon, Myanmar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">09-767676114</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">wildsoulclubofficial@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Mon - Sat: 9:00 AM - 6:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      {/* <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="text-center"
              >
                <value.icon className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      
      {/* CTA */}
      {/* <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Tribe?</h2>
          <p className="text-muted-foreground mb-6">Explore our latest collection and find your style.</p>
          <Link href="/collections">
            <Button size="lg">Explore Collections</Button>
          </Link>
        </div>
      </section> */}
      <Footer />
    </div>
  );
}
