"use client";

import { Truck, Clock, ShieldCheck, MapPin, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const info = [
  {
    icon: Truck,
    title: "Delivery Areas",
    desc: "We deliver nationwide across Myanmar. Major cities like Yangon, Mandalay, and Naypyidaw typically receive orders within 2-3 business days. Other regions may take 5-7 business days.",
  },
  {
    icon: Clock,
    title: "Processing Time",
    desc: "Orders are processed within 24-48 hours after payment confirmation. During peak seasons or promotional periods, processing may take up to 72 hours.",
  },
  {
    icon: Package,
    title: "Delivery Fees",
    desc: "Yangon area: 3,000 MMK. Other regions: calculated at checkout based on location. Free delivery for orders over 100,000 MMK.",
  },
  {
    icon: ShieldCheck,
    title: "Tracking",
    desc: "Once your order is shipped, you will receive a tracking number via SMS and email. You can also track your order in your account dashboard.",
  },
  {
    icon: MapPin,
    title: "Pickup",
    desc: "Free pickup available at our Yangon location. Select 'Pickup' at checkout and we'll contact you when your order is ready (usually within 24 hours).",
  },
];

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Delivery Information</h1>
        <p className="text-muted-foreground">
          Everything you need to know about delivery and shipping.
        </p>
      </div>

      <div className="space-y-6">
        {info.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-6 flex gap-4">
              <item.icon className="h-8 w-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Important Notes</h3>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Delivery times are estimates and may vary due to weather or road conditions.</li>
          <li>Please ensure your shipping address is correct. We are not responsible for incorrect addresses.</li>
          <li>If you are not available at the time of delivery, the courier will attempt to contact you.</li>
          <li>For any delivery concerns, contact us at hello@wildsoulclub.com</li>
        </ul>
      </div>
    </div>
  );
}
