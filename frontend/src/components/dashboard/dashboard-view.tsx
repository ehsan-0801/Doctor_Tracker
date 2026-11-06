"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarPlus, Stethoscope, UserRoundCheck, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/shared/states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dashboardApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatMonth, formatMonthShort, formatNumber } from "@/lib/format";
import { CHART, ChartCard, ChartTooltip } from "./chart-card";
import { RecentPatients } from "./recent-patients";
import { StatCard } from "./stat-card";

const PERIODS = [
  { months: 6, label: "Last 6 months" },
  { months: 12, label: "Last 12 months" },
  { months: 24, label: "Last 24 months" },
];

const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

function trendText(current: number, previous: number, days: number) {
  if (previous === 0) return current > 0 ? "No records in the previous period" : "No change from previous period";
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return "Same as previous period";
  return `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% vs. previous ${days} days`;
}

export function DashboardView() {
  const [months, setMonths] = useState(12);
  const stats = useQuery({ queryKey: [...queryKeys.dashboard.all, "stats"], queryFn: dashboardApi.stats });
  const perDoctor = useQuery({
    queryKey: [...queryKeys.dashboard.all, "per-doctor"],
    queryFn: () => dashboardApi.patientsPerDoctor(8),
  });
  const registrations = useQuery({
    queryKey: [...queryKeys.dashboard.all, "registrations", months],
    queryFn: () => dashboardApi.registrations(months),
    placeholderData: keepPreviousData,
  });
  const conditions = useQuery({
    queryKey: [...queryKeys.dashboard.all, "conditions"],
    queryFn: () => dashboardApi.conditions(8),
  });

  const s = stats.data;
  const registrationTotal = registrations.data?.reduce((sum, m) => sum + m.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of doctors, patients, and registration activity." />

      {stats.error && !s ? (
        <div className="rounded-xl border bg-card">
          <ErrorState message={stats.error.message} onRetry={() => stats.refetch()} />
        </div>
      ) : (
        <section aria-label="Key statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total doctors"
            icon={Stethoscope}
            loading={stats.isLoading}
            value={s && formatNumber(s.totalDoctors)}
            footnote={s && `${plural(s.recentDoctors, "doctor")} added in the last ${s.recentPeriodDays} days`}
          />
          <StatCard
            label="Total patients"
            icon={Users}
            loading={stats.isLoading}
            value={s && formatNumber(s.totalPatients)}
            footnote={s && `${formatNumber(s.assignedPatients)} assigned · ${formatNumber(s.unassignedPatients)} unassigned`}
          />
          <StatCard
            label="Avg. patients per doctor"
            icon={UserRoundCheck}
            loading={stats.isLoading}
            value={s && s.averagePatientsPerDoctor.toLocaleString("en-US", { maximumFractionDigits: 1 })}
            footnote="Assigned patients ÷ total doctors"
          />
          <StatCard
            label={`New patients (${s?.recentPeriodDays ?? 30} days)`}
            icon={CalendarPlus}
            loading={stats.isLoading}
            value={s && formatNumber(s.recentPatients)}
            footnote={s && trendText(s.recentPatients, s.previousPeriodPatients, s.recentPeriodDays)}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Patients per doctor"
          description="Top doctors by number of associated patients"
          loading={perDoctor.isLoading}
          error={perDoctor.error}
          onRetry={() => perDoctor.refetch()}
          isEmpty={!perDoctor.data?.length}
          emptyText="Patients will appear here once they are assigned to doctors."
          table={{
            caption: "Patients per doctor",
            headers: ["Doctor", "Patients"],
            rows: perDoctor.data?.map((d) => [d.name, d.patientCount]) ?? [],
          }}
        >
          <ResponsiveContainer width="100%" height={Math.max(220, (perDoctor.data?.length ?? 0) * 40 + 30)}>
            <BarChart data={perDoctor.data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: CHART.font, fill: CHART.axis }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                tick={{ fontSize: CHART.font, fill: "var(--foreground)" }}
                tickFormatter={(name: string) => (name.length > 20 ? `${name.slice(0, 19)}…` : name)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as { name: string; specialization: string; patientCount: number } | undefined;
                  return active && row ? (
                    <ChartTooltip label={`${row.name} · ${row.specialization}`} value={plural(row.patientCount, "patient")} />
                  ) : null;
                }}
              />
              <Bar dataKey="patientCount" fill={CHART.mark} radius={[0, 4, 4, 0]} maxBarSize={22}>
                <LabelList dataKey="patientCount" position="right" style={{ fontSize: CHART.font, fill: "var(--foreground)" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Patient registrations"
          description={`New patient records per month · ${formatNumber(registrationTotal)} in the last ${months} months`}
          action={
            <Select value={String(months)} onValueChange={(value) => setMonths(Number(value))}>
              <SelectTrigger size="sm" className="w-[150px] shrink-0" aria-label="Registration period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {PERIODS.map((period) => (
                  <SelectItem key={period.months} value={String(period.months)}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          loading={registrations.isLoading}
          error={registrations.error}
          onRetry={() => registrations.refetch()}
          isEmpty={registrationTotal === 0}
          emptyText="Monthly registrations will appear once patients are added."
          table={{
            caption: "Patient registrations per month",
            headers: ["Month", "New patients"],
            rows: registrations.data?.map((m) => [formatMonth(m.month), m.count]) ?? [],
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={registrations.data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="registrationsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.mark} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={CHART.mark} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonthShort}
                tick={{ fontSize: CHART.font, fill: CHART.axis }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: CHART.font, fill: CHART.axis }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as { month: string; count: number } | undefined;
                  return active && row ? <ChartTooltip label={formatMonth(row.month)} value={plural(row.count, "new patient")} /> : null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART.mark}
                strokeWidth={2}
                fill="url(#registrationsFill)"
                activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2, fill: CHART.mark }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Patients by condition"
          description="Most common conditions across all patient records"
          loading={conditions.isLoading}
          error={conditions.error}
          onRetry={() => conditions.refetch()}
          isEmpty={!conditions.data?.length}
          emptyText="Condition statistics will appear once patients are added."
          table={{
            caption: "Patients by condition",
            headers: ["Condition", "Patients"],
            rows: conditions.data?.map((c) => [c.condition, c.count]) ?? [],
          }}
        >
          <ResponsiveContainer width="100%" height={Math.max(200, (conditions.data?.length ?? 0) * 38 + 30)}>
            <BarChart data={conditions.data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: CHART.font, fill: CHART.axis }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="condition"
                width={150}
                tick={{ fontSize: CHART.font, fill: "var(--foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as { condition: string; count: number } | undefined;
                  return active && row ? <ChartTooltip label={row.condition} value={plural(row.count, "patient")} /> : null;
                }}
              />
              <Bar dataKey="count" fill={CHART.mark} radius={[0, 4, 4, 0]} maxBarSize={22}>
                <LabelList dataKey="count" position="right" style={{ fontSize: CHART.font, fill: "var(--foreground)" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <RecentPatients />
      </div>
    </div>
  );
}
