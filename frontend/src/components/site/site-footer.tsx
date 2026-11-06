"use client";

import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { localized } from "@/lib/i18n/dictionaries";
import type { PublicSite } from "@/types/site";
import { useLanguage } from "./language-provider";

export function SiteFooter({ site }: { site: PublicSite }) {
  const { t, lang } = useLanguage();
  const { contact } = site;
  const address = localized(lang, contact.address, contact.addressBn);
  const hours = localized(lang, contact.hours, contact.hoursBn);
  const name = localized(lang, site.hospitalName, site.hospitalNameBn);

  return (
    <footer className="bg-slate-deep text-ice">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr] lg:px-8">
        <div className="space-y-5">
          <Brand inverted />
          <p className="max-w-sm text-2xl leading-snug font-semibold tracking-tight text-white">{localized(lang, site.tagline, site.taglineBn)}</p>
          <p className="text-sm">{name}</p>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-coral uppercase">{t.footer.explore}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="transition-colors hover:text-coral" href="/find-a-doctor">{t.nav.findDoctor}</Link></li>
            <li><Link className="transition-colors hover:text-coral" href="/#services">{t.nav.services}</Link></li>
            <li><Link className="transition-colors hover:text-coral" href="/#about">{t.footer.aboutUs}</Link></li>
            <li><Link className="transition-colors hover:text-coral" href="/login">{t.footer.signIn}</Link></li>
          </ul>
        </div>
        <address className="space-y-2.5 text-sm not-italic">
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-coral uppercase">{t.footer.contact}</h2>
          {address && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{address}</p>}
          {contact.phone && <p className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" aria-hidden /><a className="transition-colors hover:text-coral" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a></p>}
          {contact.email && <p className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" aria-hidden /><a className="transition-colors hover:text-coral" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
          {hours && <p className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0" aria-hidden />{hours}</p>}
        </address>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs sm:px-6 lg:px-8">
          © {name}. {t.footer.powered}
        </p>
      </div>
    </footer>
  );
}
