"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Newspaper, DollarSign } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Sparkline with no SSR
const Sparkline = dynamic(() => import("./Sparkline"), { ssr: false });

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: string;
  sparkline: number[];
}

const iconMap: Record<string, React.ElementType> = {
  Users,
  Calendar,
  Newspaper,
  DollarSign,
};

export function StatsCard({ title, value, change, trend, icon, sparkline }: StatsCardProps) {
  const isPositive = trend === "up";
  const IconComponent = iconMap[icon] || Users; // Default to Users if not found

  return (
    <Card className="bg-gray-900 border-gray-800 text-white overflow-hidden relative">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg ${isPositive ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"}`}>
            <IconComponent className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <span className={`text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {change} <span className="text-gray-500 ml-1">vs mes anterior</span>
          </span>

          <Sparkline data={sparkline} id={title} />
        </div>
      </CardContent>
    </Card>
  );
}
