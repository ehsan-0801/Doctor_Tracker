import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import type { PublicSite } from "@/types/site";

export function SiteFooter({ site }: { site: PublicSite }) {
  const { contact } = site;
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Brand inverted />
          <p className="max-w-sm text-sm leading-relaxed">
            {site.hospitalName} — {site.tagline}
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">Explore</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/find-a-doctor">Find a doctor</Link></li>
            <li><Link className="hover:text-white" href="/#services">Services</Link></li>
            <li><Link className="hover:text-white" href="/#about">About us</Link></li>
            <li><Link className="hover:text-white" href="/login">Staff &amp; doctor sign in</Link></li>
          </ul>
        </div>
        <address className="space-y-2.5 text-sm not-italic">
          <h2 className="mb-3 text-sm font-semibold text-white">Contact</h2>
          {contact.address && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{contact.address}</p>}
          {contact.phone && <p className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" aria-hidden /><a className="hover:text-white" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a></p>}
          {contact.email && <p className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" aria-hidden /><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
          {contact.hours && <p className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0" aria-hidden />{contact.hours}</p>}
        </address>
      </div>
      <div className="border-t border-sidebar-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs sm:px-6 lg:px-8">
          © {site.hospitalName}. Powered by DocTrack. Video: Mixkit (free license).
        </p>
      </div>
    </footer>
  );
}
