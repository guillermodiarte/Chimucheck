
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  return (
    <Card className="bg-gray-900 border-gray-800 text-white h-full">
      <CardHeader>
        <CardTitle>Distribución de Premios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-3xl font-bold text-white">4.5k</span>
            <p className="text-xs text-gray-400">Total Premios</p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-400">{item.name} ({item.value}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
