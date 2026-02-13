
"use client";

import dynamic from "next/dynamic";
import { registrationData, prizeDistributionData } from "@/components/admin/dashboard/mockData";

// Dynamically import charts with no SSR
const AnalyticsChart = dynamic(() => import("./AnalyticsChart").then(mod => mod.AnalyticsChart), { ssr: false });
const DistributionChart = dynamic(() => import("./DistributionChart").then(mod => mod.DistributionChart), { ssr: false });

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-3 h-[400px]">
      <div className="md:col-span-2 h-full">
        <AnalyticsChart data={registrationData} />
      </div>
      <div className="md:col-span-1 h-full">
        <DistributionChart data={prizeDistributionData} />
      </div>
    </div>
  );
}
