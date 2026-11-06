import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock, LineChart, Mail, MapPin, Megaphone, Phone, Search, UserRoundCheck } from "lucide-react";
import { LiveStats } from "@/components/site/live-stats";
import { PublicDoctorCard } from "@/components/site/public-doctor-card";
import { ServiceIconView } from "@/components/site/service-icon";
import { Button } from "@/components/ui/button";
import { getPublicSite } from "@/lib/server/public-api";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSite();
  return { title: { absolute: `${site.hospitalName} · DocTrack` }, description: site.heroSubtitle };
}

const STEPS = [
  { icon: Search, title: "Find your specialist", text: "Browse doctors by speciality and hospital across our network." },
  { icon: UserRoundCheck, title: "Get a dedicated doctor", text: "Our front desk registers you and assigns the right specialist." },
  { icon: LineChart, title: "Track your progress", text: "Your doctor records each update so your care team stays in sync." },
];

export default async function HomePage() {
  const site = await getPublicSite();
  const tel = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;

  return (
    <>
      {site.announcements.length > 0 && (
        <section aria-label="Announcements" className="border-b bg-accent">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2.5 text-sm text-accent-foreground sm:px-6 lg:px-8">
            {site.announcements.map((a) => (
              <li key={a.title} className="flex items-start gap-2">
                <Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <strong className="font-semibold">{a.title}</strong>
                  {a.body && <span className="text-accent-foreground/90"> — {a.body}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,var(--accent),transparent_60%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:px-8">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-primary">
              {site.hospitalName}
            </p>
            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">{site.heroTitle}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{site.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/find-a-doctor">
                  <Search aria-hidden /> Find a doctor
                </Link>
              </Button>
              {site.contact.phone && (
                <Button asChild variant="outline" size="lg" className="h-12 bg-card px-6 text-base">
                  <a href={tel(site.contact.phone)}>
                    <Phone aria-hidden /> Call {site.contact.phone}
                  </a>
                </Button>
              )}
            </div>
            {site.contact.hours && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" aria-hidden /> {site.contact.hours}
              </p>
            )}
          </div>
          <div className="relative">
            <div className="aspect-[16/10] overflow-hidden rounded-3xl border bg-muted shadow-xl">
              {/* Decorative, muted, looping clip; reduced-motion users see the still poster. */}
              <video
                className="size-full object-cover motion-reduce:hidden"
                src="/media/hero-care-team.mp4"
                poster="/media/hero-care-team.webp"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- static poster, already optimized */}
              <img src="/media/hero-care-team.webp" alt="" className="hidden size-full object-cover motion-reduce:block" />
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lg sm:left-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <CalendarCheck className="size-5" aria-hidden />
              </span>
              <div className="text-sm">
                <p className="font-semibold">Coordinated care</p>
                <p className="text-muted-foreground">One doctor, one care record</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {site.homepage.showStats && site.stats && (
        <div className="py-6">
          <LiveStats initial={site} />
        </div>
      )}

      {site.services.length > 0 && (
        <section id="services" className="scroll-mt-20 py-16" aria-labelledby="services-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl space-y-2">
              <p className="text-sm font-semibold text-primary">Services</p>
              <h2 id="services-title" className="text-3xl font-bold tracking-tight">Specialist care under one network</h2>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {site.services.map((service) => (
                <li key={service.title} className="rounded-2xl border bg-card p-6">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <ServiceIconView icon={service.icon} className="size-6" />
                  </span>
                  <h3 className="mb-1.5 font-semibold">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {site.homepage.showDoctors && site.featuredDoctors.length > 0 && (
        <section className="bg-card py-16" aria-labelledby="doctors-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-primary">Our doctors</p>
                <h2 id="doctors-title" className="text-3xl font-bold tracking-tight">Meet our specialists</h2>
              </div>
              <Button asChild variant="outline" size="lg" className="h-10">
                <Link href="/find-a-doctor">
                  View all doctors <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {site.featuredDoctors.map((doctor) => (
                <li key={doctor._id}>
                  <PublicDoctorCard doctor={doctor} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="about" className="scroll-mt-20 py-16" aria-labelledby="about-title">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-3xl border shadow-lg">
            <video
              className="aspect-[4/3] size-full object-cover motion-reduce:hidden"
              src="/media/hospital-hallway.mp4"
              poster="/media/hospital-hallway.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- static poster */}
            <img src="/media/hospital-hallway.webp" alt="" className="hidden aspect-[4/3] size-full object-cover motion-reduce:block" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">About us</p>
              <h2 id="about-title" className="text-3xl font-bold tracking-tight">{site.tagline}</h2>
            </div>
            <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{site.about}</p>
            <ol className="space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 pb-20" aria-labelledby="contact-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <h2 id="contact-title" className="text-3xl font-bold tracking-tight">Need care? We are here to help.</h2>
              <p className="max-w-lg text-primary-foreground/85">
                Call the front desk to register or speak to a care coordinator. For emergencies, call our 24/7 line.
              </p>
              {site.contact.emergencyPhone && (
                <Button asChild size="lg" variant="secondary" className="mt-2 h-12 px-6 text-base">
                  <a href={tel(site.contact.emergencyPhone)}>
                    <Phone aria-hidden /> Emergency {site.contact.emergencyPhone}
                  </a>
                </Button>
              )}
            </div>
            <address className="space-y-3 text-sm not-italic">
              {site.contact.address && <p className="flex gap-3"><MapPin className="size-5 shrink-0" aria-hidden />{site.contact.address}</p>}
              {site.contact.phone && <p className="flex gap-3"><Phone className="size-5 shrink-0" aria-hidden /><a href={tel(site.contact.phone)} className="underline-offset-4 hover:underline">{site.contact.phone}</a></p>}
              {site.contact.email && <p className="flex gap-3"><Mail className="size-5 shrink-0" aria-hidden /><a href={`mailto:${site.contact.email}`} className="underline-offset-4 hover:underline">{site.contact.email}</a></p>}
              {site.contact.hours && <p className="flex gap-3"><Clock className="size-5 shrink-0" aria-hidden />{site.contact.hours}</p>}
            </address>
          </div>
        </div>
      </section>
    </>
  );
}
