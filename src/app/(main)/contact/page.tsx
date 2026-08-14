"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*                              Contact settings                              */
/* -------------------------------------------------------------------------- */

const contactSettings = {
  businessAddress: "Pannita Street, Hlaing Township, Yangon",
  contactEmail: "wildsoulclubofficial@gmail.com",
  contactPhone: "09767676114",
  viberNumber: "09767676114",
  deliveryNotice: "Delivery within 3–5 business days",
};

const contactMethods = [
  {
    title: "Call our hotline",
    description:
      "Speak directly with our team for order, product, or delivery questions.",
    value: contactSettings.contactPhone,
    href: `tel:${contactSettings.contactPhone}`,
    actionLabel: "Call now",
    icon: Phone,
  },
  {
    title: "Chat on Viber",
    description:
      "Send us a Viber message for quick assistance with sizing, stock, and orders.",
    value: contactSettings.viberNumber,
    href: `viber://chat?number=%2B959767676114`,
    actionLabel: "Open Viber",
    icon: MessageCircle,
  },
  {
    title: "Send us an email",
    description:
      "Email us for detailed questions, collaborations, or general support.",
    value: contactSettings.contactEmail,
    href: `mailto:${contactSettings.contactEmail}`,
    actionLabel: "Send email",
    icon: Mail,
  },
];

const supportTopics = [
  {
    title: "Product questions",
    description:
      "Ask about sizing, colors, materials, availability, and upcoming drops.",
    icon: Sparkles,
  },
  {
    title: "Order support",
    description:
      "Get assistance with order confirmation, payment review, and order status.",
    icon: ShieldCheck,
  },
  {
    title: "Delivery assistance",
    description:
      "Contact us about delivery fees, delivery areas, estimated arrival, or tracking.",
    icon: PackageCheck,
  },
];

/* -------------------------------------------------------------------------- */
/*                            Reusable glass style                            */
/* -------------------------------------------------------------------------- */

const glassCardClassName = `
  relative
  overflow-hidden
  rounded-[28px]
  border border-white/50
  bg-white/55
  shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_70px_rgba(15,23,42,0.08)]
  backdrop-blur-2xl
  backdrop-saturate-150
`;

/* -------------------------------------------------------------------------- */
/*                                Contact page                                */
/* -------------------------------------------------------------------------- */

export default function ContactPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-white">
      <main>
        {/* ------------------------------------------------------------------ */}
        {/*                              Hero                                  */}
        {/* ------------------------------------------------------------------ */}

        <section className="relative isolate overflow-hidden px-4 pb-16 pt-24 sm:px-6 md:pb-24 md:pt-32">
          {/* Background liquid shapes */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-20 bg-white"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-10 -z-10 h-[420px] w-[420px] rounded-full bg-violet-300/20 blur-[110px]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-28 -z-10 h-[380px] w-[380px] rounded-full bg-blue-300/20 blur-[120px]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[55%] -z-10 h-[360px] w-[540px] -translate-x-1/2 rounded-full bg-rose-200/20 blur-[130px]"
          />

          <div className="container mx-auto">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <div className="relative mb-5 overflow-hidden rounded-full border border-white/60 bg-white/55 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                />

                <span className="relative text-[10px] font-semibold uppercase tracking-[0.32em] text-foreground/55 sm:text-xs">
                  Wild Soul Club Support
                </span>
              </div>

              <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
                Let&apos;s stay
                <span className="block text-foreground/45">
                  connected.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                Questions about a product, an order, delivery, or the next
                Wild Soul Club drop? Reach our team directly by phone, Viber,
                or email.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <Link href={`tel:${contactSettings.contactPhone}`}>
                  <Button
                    size="lg"
                    className="h-12 rounded-full px-7 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call our hotline
                  </Button>
                </Link>

                <Link
                  href={`mailto:${contactSettings.contactEmail}`}
                  target="_blank"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-foreground/10 bg-white/60 px-7 backdrop-blur-xl"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*                         Contact information                        */}
        {/* ------------------------------------------------------------------ */}

        <section className="relative px-4 py-12 sm:px-6 md:py-20">
          <div className="container mx-auto">
            <div className="grid gap-5 lg:grid-cols-3">
              {contactMethods.map((method) => (
                <article
                  key={method.title}
                  className={`${glassCardClassName} group flex min-h-[310px] flex-col p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_32px_90px_rgba(15,23,42,0.13)] sm:p-8`}
                >
                  {/* Glass reflection */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-12 -top-20 h-48 w-[120%] rotate-[-8deg] bg-gradient-to-b from-white/70 via-white/15 to-transparent blur-2xl"
                  />

                  <div className="relative flex h-full flex-col">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                      <method.icon className="h-5 w-5 text-foreground/75" />
                    </div>

                    <h2 className="mt-8 text-xl font-semibold tracking-[-0.025em]">
                      {method.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {method.description}
                    </p>

                    <p className="mt-5 break-words text-sm font-medium text-foreground/80">
                      {method.value}
                    </p>

                    <div className="mt-auto pt-7">
                      <Link
                        href={method.href}
                        target={
                          method.href.startsWith("mailto:")
                            ? "_blank"
                            : undefined
                        }
                        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-60"
                      >
                        {method.actionLabel}

                        <ExternalLink className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*                         Address and delivery                       */}
        {/* ------------------------------------------------------------------ */}

        <section className="px-4 py-12 sm:px-6 md:py-20">
          <div className="container mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Address */}
              <article
                className={`${glassCardClassName} min-h-[420px] p-6 sm:p-8 md:p-10`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl"
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Our location
                    </span>
                  </div>

                  <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
                    Visit Wild Soul Club in Yangon.
                  </h2>

                  <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
                    {contactSettings.businessAddress}
                  </p>

                  <div className="mt-auto pt-10">
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        contactSettings.businessAddress,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="rounded-full border-foreground/10 bg-white/50 backdrop-blur-xl"
                      >
                        Open in Google Maps
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>

              {/* Delivery */}
              <article
                className={`${glassCardClassName} min-h-[420px] p-6 sm:p-8 md:p-10`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl"
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl">
                    <PackageCheck className="h-5 w-5" />
                  </div>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Delivery information
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                    Carefully packed.
                    <span className="block text-foreground/45">
                      Delivered to you.
                    </span>
                  </h2>

                  <p className="mt-5 text-base leading-7 text-muted-foreground">
                    {contactSettings.deliveryNotice}. Delivery time may vary
                    depending on your township, courier availability, public
                    holidays, and weather conditions.
                  </p>

                  <div className="mt-auto flex items-center gap-3 pt-8 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    <span>Contact us for an order-specific update.</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*                          Support topics                            */}
        {/* ------------------------------------------------------------------ */}

        <section className="px-4 py-16 sm:px-6 md:py-24">
          <div className="container mx-auto">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                How we can help
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Support for every part of your order.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {supportTopics.map((topic) => (
                <div
                  key={topic.title}
                  className="group rounded-[26px] border border-border/60 bg-white/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/10 hover:shadow-[0_20px_55px_rgba(15,23,42,0.07)] sm:p-7"
                >
                  <topic.icon className="h-6 w-6 text-foreground/70" />

                  <h3 className="mt-6 text-lg font-semibold">
                    {topic.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {topic.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*                              Privacy                               */}
        {/* ------------------------------------------------------------------ */}

        <section className="px-4 py-12 sm:px-6 md:py-20">
          <div className="container mx-auto">
            <div className={`${glassCardClassName} p-6 sm:p-8 md:p-12`}>
              <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr_auto]">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.025em]">
                    Contact us without submitting personal information
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    This page does not include a contact form and does not
                    collect or store your name, email address, phone number,
                    or message. Contacting us through email, phone, or Viber is
                    handled through the service you choose.
                  </p>
                </div>

                <Link href="/privacy">
                  <Button
                    variant="outline"
                    className="w-full rounded-full bg-white/50 md:w-auto"
                  >
                    Privacy policy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*                                CTA                                 */}
        {/* ------------------------------------------------------------------ */}

        <section className="px-4 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-20">
          <div className="container mx-auto">
            <div className="relative overflow-hidden rounded-[36px] border border-neutral-200 bg-white px-6 py-16 text-center text-foreground shadow-[0_35px_100px_rgba(0,0,0,0.22)] sm:px-10 md:py-24">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-violet-500/20 blur-[90px]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-blue-500/20 blur-[100px]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
              />

              <div className="relative mx-auto max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                  Discover Wild Soul Club
                </p>

                <h2 className="mt-5 text-4xl font-semibold leading-none tracking-[-0.05em] sm:text-5xl md:text-6xl">
                  Find your next piece.
                </h2>

                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-foreground/60">
                  Explore our latest products, new drops, and selected archive
                  pieces.
                </p>

                <Link href="/products" className="mt-8 inline-flex">
                  <Button
                    size="lg"
                    className="h-12 rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                  >
                    Shop all products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}