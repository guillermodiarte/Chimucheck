
"use client";

import dynamic from "next/dynamic";

const AnalyticsChart = dynamic(() => import("./AnalyticsChart").then(mod => mod.AnalyticsChart), { ssr: false });
const DistributionChart = dynamic(() => import("./DistributionChart").then(mod => mod.DistributionChart), { ssr: false });

interface DashboardChartsProps {
  registrationData: { name: string; value: number }[];
  prizeDistributionData: { name: string; value: number; color: string }[];
  totalMedals: number;
}

export function DashboardCharts({ registrationData, prizeDistributionData, totalMedals }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 h-[400px]">
      <div className="md:col-span-2 h-full">
        <AnalyticsChart data={registrationData} />
      </div>
      <div className="md:col-span-1 h-full">
        <DistributionChart data={prizeDistributionData} totalMedals={totalMedals} />
      </div>
    </div>
  );
}
