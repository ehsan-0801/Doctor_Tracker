"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { DoctorCombobox } from "@/components/patients/doctor-combobox";
import { AccessDenied } from "@/components/shared/access-denied";
import { fieldAria, FormField } from "@/components/shared/form-field";
import { ErrorState } from "@/components/shared/states";
import { SERVICE_ICON_MAP } from "@/components/site/service-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { settingsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { applyApiErrors } from "@/lib/form-errors";
import { SERVICE_ICONS, type SiteSettings } from "@/types/site";
import { SettingsSection } from "./settings-section";

const text = (max: number, min = 0, message = "Required") => z.string().trim().max(max).min(min, message);

// Mirrors backend/src/validators/settings.validator.ts.
const schema = z.object({
  hospitalName: text(120, 2, "Hospital name is required"),
  tagline: text(160),
  heroTitle: text(120, 3, "Headline is required"),
  heroSubtitle: text(300),
  about: text(1500),
  services: z.array(z.object({ title: text(60, 2, "Title is required"), description: text(240, 2, "Description is required"), icon: z.enum(SERVICE_ICONS) })).max(12),
  announcements: z.array(z.object({ title: text(100, 2, "Title is required"), body: text(400), active: z.boolean() })).max(10),
  contact: z.object({
    phone: text(40),
    emergencyPhone: text(40),
    email: z.union([z.literal(""), z.string().trim().pipe(z.email("Enter a valid email"))]),
    address: text(200),
    hours: text(120),
  }),
  homepage: z.object({ showStats: z.boolean(), showDoctors: z.boolean() }),
  featured: z.array(z.object({ _id: z.string(), name: z.string() })).max(8, "Feature up to 8 doctors"),
});
type FormValues = z.infer<typeof schema>;

const toForm = (s: SiteSettings): FormValues => ({
  hospitalName: s.hospitalName,
  tagline: s.tagline,
  heroTitle: s.heroTitle,
  heroSubtitle: s.heroSubtitle,
  about: s.about,
  services: s.services ?? [],
  announcements: s.announcements ?? [],
  contact: s.contact,
  homepage: { showStats: s.homepage.showStats, showDoctors: s.homepage.showDoctors },
  featured: (s.featuredDoctors ?? []).map((d) => ({ _id: d._id, name: d.name })),
});

function Checkbox({ id, label, hint, ...props }: React.ComponentProps<"input"> & { id: string; label: string; hint?: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50">
      <input id={id} type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...props} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

const firstError = (errors: FieldErrors<FormValues>) => (Object.keys(errors).length > 0 ? "Please fix the highlighted fields." : null);

export function SiteSettingsView() {
  const session = useSession();
  const queryClient = useQueryClient();
  const allowed = session.can("settings:manage");
  const settings = useQuery({ queryKey: queryKeys.settings, queryFn: settingsApi.get, enabled: allowed });

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { register, control, handleSubmit, reset, setError, formState } = form;
  const { errors, isSubmitting, isDirty } = formState;
  const services = useFieldArray({ control, name: "services" });
  const announcements = useFieldArray({ control, name: "announcements" });
  const featured = useFieldArray({ control, name: "featured" });

  useEffect(() => {
    if (settings.data) reset(toForm(settings.data));
  }, [settings.data, reset]);

  if (!session.isLoading && !allowed) return <AccessDenied />;

  const onSubmit = handleSubmit(
    async (values) => {
      const { featured: featuredDoctors, homepage, ...rest } = values;
      try {
        const saved = await settingsApi.update({
          ...rest,
          homepage: { ...homepage, featuredDoctorIds: featuredDoctors.map((d) => d._id) },
        });
        queryClient.setQueryData(queryKeys.settings, saved);
        reset(toForm(saved));
        toast.success("Site settings saved", { description: "The public website updates within about a minute." });
      } catch (error) {
        applyApiErrors(error, setError, ["hospitalName", "heroTitle", "contact.email"]);
      }
    },
    (errs) => toast.error(firstError(errs) ?? "Please check the form."),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 pb-24">
      <PageHeader
        title="Site settings"
        description="Edit what visitors see on the public website."
        actions={
          <Button asChild variant="outline" size="lg" className="h-10">
            <Link href="/" target="_blank">
              View website <ExternalLink aria-hidden />
            </Link>
          </Button>
        }
      />

      {settings.isLoading || session.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : settings.error ? (
        <div className="rounded-xl border bg-card">
          <ErrorState message={settings.error.message} onRetry={() => settings.refetch()} />
        </div>
      ) : (
        <>
          <SettingsSection title="Hospital & hero" description="Name, headline and introduction shown at the top of the homepage.">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField id="hospitalName" label="Hospital name" error={errors.hospitalName?.message}>
                <Input {...fieldAria("hospitalName", errors.hospitalName?.message)} className="h-10" {...register("hospitalName")} />
              </FormField>
              <FormField id="tagline" label="Tagline" error={errors.tagline?.message}>
                <Input {...fieldAria("tagline", errors.tagline?.message)} className="h-10" {...register("tagline")} />
              </FormField>
            </div>
            <FormField id="heroTitle" label="Headline" error={errors.heroTitle?.message}>
              <Input {...fieldAria("heroTitle", errors.heroTitle?.message)} className="h-10" {...register("heroTitle")} />
            </FormField>
            <FormField id="heroSubtitle" label="Introduction" error={errors.heroSubtitle?.message}>
              <Textarea {...fieldAria("heroSubtitle", errors.heroSubtitle?.message)} rows={2} {...register("heroSubtitle")} />
            </FormField>
            <FormField id="about" label="About us" error={errors.about?.message} hint="Shown in the About section. Line breaks are kept.">
              <Textarea {...fieldAria("about", errors.about?.message)} rows={5} {...register("about")} />
            </FormField>
          </SettingsSection>

          <SettingsSection title="Contact" description="Used in the header, contact section and footer. Leave a field empty to hide it.">
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["contact.phone", "Front desk phone", "tel"],
                  ["contact.emergencyPhone", "Emergency phone", "tel"],
                  ["contact.email", "Email", "email"],
                  ["contact.hours", "Opening hours", "text"],
                ] as const
              ).map(([name, label, type]) => {
                const key = name.split(".")[1] as keyof FormValues["contact"];
                const message = errors.contact?.[key]?.message;
                return (
                  <FormField key={name} id={name} label={label} error={message}>
                    <Input {...fieldAria(name, message)} type={type} className="h-10" {...register(name)} />
                  </FormField>
                );
              })}
            </div>
            <FormField id="contact.address" label="Address" error={errors.contact?.address?.message}>
              <Input {...fieldAria("contact.address", errors.contact?.address?.message)} className="h-10" {...register("contact.address")} />
            </FormField>
          </SettingsSection>

          <SettingsSection title="Homepage" description="Choose which live sections appear and which doctors are featured.">
            <div className="grid gap-3 md:grid-cols-2">
              <Checkbox id="showStats" label="Show live network statistics" hint="Doctor, speciality and hospital counts from the database." {...register("homepage.showStats")} />
              <Checkbox id="showDoctors" label="Show featured doctors" hint="If none are selected, the newest doctors are shown." {...register("homepage.showDoctors")} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Featured doctors ({featured.fields.length}/8)</p>
              <ul className="space-y-2">
                {featured.fields.map((field, index) => (
                  <li key={field.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <span className="flex-1 truncate font-medium">{field.name}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => featured.move(index, index - 1)} disabled={index === 0} aria-label={`Move ${field.name} up`}>
                      <ArrowUp />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => featured.move(index, index + 1)} disabled={index === featured.fields.length - 1} aria-label={`Move ${field.name} down`}>
                      <ArrowDown />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => featured.remove(index)} aria-label={`Remove ${field.name}`}>
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
              {featured.fields.length < 8 && (
                <div className="max-w-sm">
                  <DoctorCombobox
                    id="add-featured"
                    value={null}
                    placeholder="Add a featured doctor…"
                    onChange={(choice) => {
                      if (choice && !featured.fields.some((f) => f._id === choice._id)) featured.append({ _id: choice._id, name: choice.name });
                    }}
                  />
                </div>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Services"
            description="Departments and services listed on the homepage (up to 12)."
            action={
              <Button type="button" variant="outline" onClick={() => services.append({ title: "", description: "", icon: "stethoscope" })} disabled={services.fields.length >= 12}>
                <Plus aria-hidden /> Add service
              </Button>
            }
          >
            {services.fields.length === 0 && <p className="text-sm text-muted-foreground">No services yet. The Services section is hidden.</p>}
            <ul className="space-y-3">
              {services.fields.map((field, index) => {
                const e = errors.services?.[index];
                return (
                  <li key={field.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[180px_1fr_auto]">
                    <Controller
                      control={control}
                      name={`services.${index}.icon`}
                      render={({ field: iconField }) => (
                        <Select value={iconField.value} onValueChange={iconField.onChange}>
                          <SelectTrigger className="h-10! w-full" aria-label={`Icon for service ${index + 1}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {SERVICE_ICONS.map((icon) => {
                              const Icon = SERVICE_ICON_MAP[icon];
                              return (
                                <SelectItem key={icon} value={icon}>
                                  <Icon aria-hidden /> {icon}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <div className="space-y-2">
                      <Input aria-label={`Service ${index + 1} title`} aria-invalid={!!e?.title || undefined} placeholder="Title" className="h-10" {...register(`services.${index}.title`)} />
                      <Textarea aria-label={`Service ${index + 1} description`} aria-invalid={!!e?.description || undefined} placeholder="Short description" rows={2} {...register(`services.${index}.description`)} />
                      {(e?.title || e?.description) && <p className="text-xs text-destructive">{e?.title?.message ?? e?.description?.message}</p>}
                    </div>
                    <div className="flex gap-1 md:flex-col">
                      <Button type="button" variant="ghost" size="icon" onClick={() => services.move(index, index - 1)} disabled={index === 0} aria-label={`Move service ${index + 1} up`}>
                        <ArrowUp />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => services.move(index, index + 1)} disabled={index === services.fields.length - 1} aria-label={`Move service ${index + 1} down`}>
                        <ArrowDown />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => services.remove(index)} aria-label={`Remove service ${index + 1}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SettingsSection>

          <SettingsSection
            title="Announcements"
            description="Short notices shown in a banner at the top of the homepage (up to 10)."
            action={
              <Button type="button" variant="outline" onClick={() => announcements.append({ title: "", body: "", active: true })} disabled={announcements.fields.length >= 10}>
                <Plus aria-hidden /> Add announcement
              </Button>
            }
          >
            {announcements.fields.length === 0 && <p className="text-sm text-muted-foreground">No announcements.</p>}
            <ul className="space-y-3">
              {announcements.fields.map((field, index) => {
                const e = errors.announcements?.[index];
                return (
                  <li key={field.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <Input aria-label={`Announcement ${index + 1} title`} aria-invalid={!!e?.title || undefined} placeholder="Title" className="h-10" {...register(`announcements.${index}.title`)} />
                      <Input aria-label={`Announcement ${index + 1} details`} placeholder="Details (optional)" className="h-10" {...register(`announcements.${index}.body`)} />
                      {e?.title && <p className="text-xs text-destructive">{e.title.message}</p>}
                    </div>
                    <div className="flex items-center gap-3 md:flex-col md:items-end">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register(`announcements.${index}.active`)} /> Visible
                      </label>
                      <Button type="button" variant="ghost" size="icon" onClick={() => announcements.remove(index)} aria-label={`Remove announcement ${index + 1}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SettingsSection>

          <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur md:left-[72px] lg:left-[250px]">
            <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
                {isDirty ? "You have unsaved changes." : "All changes saved."}
              </p>
              <Button type="button" variant="outline" size="lg" disabled={!isDirty || isSubmitting} onClick={() => settings.data && reset(toForm(settings.data))}>
                Discard
              </Button>
              <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
