
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AnalyticsChartProps {
  data: { name: string; value: number }[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <Card className="bg-gray-900 border-gray-800 text-white h-full">
      <CardHeader>
        <CardTitle>Nuevos Registros (Últimas 12 Semanas)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151" }}
                itemStyle={{ color: "#EAB308" }}
                cursor={{ fill: "#374151", opacity: 0.4 }}
              />
              <Bar
                dataKey="value"
                fill="#EAB308"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
