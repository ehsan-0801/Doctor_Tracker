"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarCheck, Clock, Mail, MapPin, Megaphone, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localized, toBnDigits } from "@/lib/i18n/dictionaries";
import type { PublicSite } from "@/types/site";
import { useLanguage } from "./language-provider";
import { LiveStats } from "./live-stats";
import { PublicDoctorCard } from "./public-doctor-card";
import { SectionHeading } from "./section-heading";
import { ServiceIconView } from "./service-icon";

const tel = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;

/** Splits a headline so its final words can carry the coral highlight. */
function splitHeadline(text: string): [string, string] {
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return ["", text];
  const tail = words.slice(-2).join(" ");
  return [words.slice(0, -2).join(" "), tail];
}

export function HomeContent({ site }: { site: PublicSite }) {
  const { t, lang } = useLanguage();
  const L = (en: string, bn?: string) => localized(lang, en, bn);
  const num = (n: number) => (lang === "bn" ? toBnDigits(String(n).padStart(2, "0")) : String(n).padStart(2, "0"));
  const hours = L(site.contact.hours, site.contact.hoursBn);
  const address = L(site.contact.address, site.contact.addressBn);
  const [headLead, headTail] = splitHeadline(L(site.heroTitle, site.heroTitleBn));
  let section = 0;
  const nextIndex = () => num(++section);

  return (
    <>
      {site.announcements.length > 0 && (
        <section aria-label="Announcements" className="bg-slate-deep text-white">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
            {site.announcements.map((a) => (
              <li key={a.title} className="flex items-start gap-2">
                <Megaphone className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden />
                <span>
                  <strong className="font-semibold">{L(a.title, a.titleBn)}</strong>
                  {L(a.body, a.bodyBn) && <span className="text-ice"> — {L(a.body, a.bodyBn)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Hero — asymmetric editorial composition */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-28">
          <div className="space-y-8 lg:col-span-6 lg:pt-6">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-slate-deep uppercase">
              <span className="h-px w-10 bg-coral-deep" aria-hidden />
              {L(site.hospitalName, site.hospitalNameBn)}
            </p>
            <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance text-slate-deep sm:text-6xl xl:text-7xl">
              {headLead && <>{headLead} </>}
              <span className="relative inline-block">
                <span className="relative z-10">{headTail}</span>
                <span className="absolute inset-x-0 bottom-[0.08em] -z-0 h-[0.32em] bg-coral/70" aria-hidden />
              </span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">{L(site.heroSubtitle, site.heroSubtitleBn)}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group h-12 rounded-md px-6 text-base font-semibold">
                <Link href="/find-a-doctor">
                  <Search aria-hidden /> {t.findDoctor}
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-md border-teal px-6 text-base text-teal hover:bg-ice hover:text-slate-deep">
                <Link href="/#contact">{t.contactUs}</Link>
              </Button>
            </div>
            {site.homepage.showStats && site.stats && <LiveStats initial={site} />}
          </div>

          <div className="relative lg:col-span-6 lg:pl-6">
            <div className="absolute top-10 -right-6 bottom-0 left-16 bg-coral sm:-right-10 lg:-right-24" aria-hidden />
            <div className="relative ml-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-md bg-muted shadow-[0_30px_60px_-30px_rgba(37,60,72,0.45)] sm:aspect-[5/6] lg:max-w-none">
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
              {/* eslint-disable-next-line @next/next/no-img-element -- static poster */}
              <img src="/media/hero-care-team.webp" alt="" className="hidden size-full object-cover motion-reduce:block" />
            </div>
            <div className="absolute -bottom-6 left-0 flex max-w-[260px] items-start gap-3 rounded-md bg-ice p-4 shadow-lg sm:left-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-teal">
                <CalendarCheck className="size-5" aria-hidden />
              </span>
              <div className="text-sm">
                <p className="font-semibold text-slate-deep">{t.coordinatedCare}</p>
                <p className="text-slate-deep/80">{t.coordinatedCareText}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {site.services.length > 0 && (
        <section id="services" className="scroll-mt-20 bg-peach py-20 lg:py-28" aria-labelledby="services-title">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <SectionHeading index={nextIndex()} eyebrow={t.services.eyebrow} title={t.services.title} id="services-title" className="lg:col-span-4 lg:self-start lg:sticky lg:top-28">
              <p className="max-w-sm leading-relaxed text-muted-foreground">{L(site.heroSubtitle, site.heroSubtitleBn)}</p>
            </SectionHeading>
            <ol className="grid gap-x-10 sm:grid-cols-2 lg:col-span-8">
              {site.services.map((service, index) => (
                <li key={service.title} className="group relative border-t border-slate-deep/15 py-7">
                  <span className="absolute -top-px left-0 h-[2px] w-0 bg-coral-deep transition-[width] duration-500 group-hover:w-full motion-reduce:transition-none" aria-hidden />
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-white text-teal transition-colors group-hover:bg-slate-deep group-hover:text-coral">
                      <ServiceIconView icon={service.icon} className="size-[22px]" />
                    </span>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-coral-deep tabular-nums" aria-hidden>{num(index + 1)}</p>
                      <h3 className="text-lg font-semibold text-slate-deep">{L(service.title, service.titleBn)}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{L(service.description, service.descriptionBn)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {site.homepage.showDoctors && site.featuredDoctors.length > 0 && (
        <section className="bg-white py-20 lg:py-28" aria-labelledby="doctors-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading index={nextIndex()} eyebrow={t.doctors.eyebrow} title={t.doctors.title} id="doctors-title" />
              <Link href="/find-a-doctor" className="group inline-flex items-center gap-2 text-sm font-semibold text-teal">
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-bottom-left bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
                  {t.doctors.viewAll}
                </span>
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
              {site.featuredDoctors.map((doctor, index) => (
                <li key={doctor._id} className={index % 2 === 1 ? "lg:translate-y-8" : undefined}>
                  <PublicDoctorCard doctor={doctor} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="about" className="scroll-mt-20 bg-ice py-20 lg:py-28" aria-labelledby="about-title">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="relative lg:col-span-6">
            <div className="absolute -top-5 -left-5 h-2/3 w-2/3 bg-white" aria-hidden />
            <div className="relative overflow-hidden rounded-md shadow-xl">
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
          </div>
          <div className="space-y-8 lg:col-span-6 lg:pl-8">
            <SectionHeading index={nextIndex()} eyebrow={t.about.eyebrow} title={L(site.tagline, site.taglineBn)} id="about-title" />
            <p className="leading-relaxed whitespace-pre-line text-slate-deep/85">{L(site.about, site.aboutBn)}</p>
            <ol className="space-y-6">
              {t.steps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-slate-deep/15 pt-5">
                  <span className="text-3xl leading-none font-semibold text-coral-deep tabular-nums" aria-hidden>
                    {num(index + 1)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-deep">
                      <span className="sr-only">{t.step} {index + 1}: </span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-deep/80">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-white py-20 lg:py-24" aria-labelledby="contact-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-md bg-slate-deep text-white lg:grid-cols-12">
            <div className="space-y-6 p-8 sm:p-12 lg:col-span-7">
              <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-coral uppercase">
                <span className="h-px w-8 bg-coral" aria-hidden />
                {t.nav.contact}
              </p>
              <h2 id="contact-title" className="max-w-lg text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{t.contact.title}</h2>
              <p className="max-w-lg leading-relaxed text-ice">{t.contact.text}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                {site.contact.emergencyPhone && (
                  <Button asChild size="lg" className="h-12 rounded-md px-6 text-base font-semibold">
                    <a href={tel(site.contact.emergencyPhone)}>
                      <Phone aria-hidden /> {t.emergency} {site.contact.emergencyPhone}
                    </a>
                  </Button>
                )}
                {site.contact.phone && (
                  <Button asChild variant="outline" size="lg" className="h-12 rounded-md border-white/40 bg-transparent px-6 text-base text-white hover:bg-white hover:text-slate-deep">
                    <a href={tel(site.contact.phone)}>
                      <Phone aria-hidden /> {t.call} {site.contact.phone}
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <address className="space-y-5 bg-[#2c4754] p-8 text-sm not-italic sm:p-12 lg:col-span-5">
              {[
                address && { icon: MapPin, content: address },
                site.contact.phone && { icon: Phone, content: <a href={tel(site.contact.phone)} className="hover:text-coral">{site.contact.phone}</a> },
                site.contact.email && { icon: Mail, content: <a href={`mailto:${site.contact.email}`} className="hover:text-coral">{site.contact.email}</a> },
                hours && { icon: Clock, content: hours },
              ]
                .filter(Boolean)
                .map((row, i) => {
                  const { icon: Icon, content } = row as { icon: typeof MapPin; content: React.ReactNode };
                  return (
                    <p key={i} className="flex gap-3 text-ice">
                      <Icon className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden />
                      <span>{content}</span>
                    </p>
                  );
                })}
            </address>
          </div>
        </div>
      </section>
    </>
  );
}
