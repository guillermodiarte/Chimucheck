"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DistributionChartProps {
  data: { name: string; value: number; color: string }[];
  totalMedals: number;
}

export function DistributionChart({ data, totalMedals }: DistributionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const CustomTooltip = ({ active, payload, coordinate }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];

    // Calculamos si el cursor / arco está en la mitad izquierda o derecha del donut
    const width = containerRef.current?.clientWidth || 360;
    const centerX = width / 2;
    const isLeft = (coordinate?.x ?? 0) < centerX;

    return (
      <div
        style={{
          transform: isLeft ? "translate(calc(-100% - 14px), -50%)" : "translate(14px, -50%)",
        }}
        className="bg-gray-900/95 border border-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-2xl pointer-events-none flex items-center gap-1.5 whitespace-nowrap backdrop-blur-sm"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.payload?.color || item.color }}
        />
        <span className="font-semibold text-gray-200">{item.name}</span>
        <span className="text-gray-400">:</span>
        <span className="font-bold text-white">{item.value}</span>
      </div>
    );
  };

  return (
    <Card className="bg-gray-900 border-gray-800 text-white h-full">
      <CardHeader>
        <CardTitle>Distribución de Premios</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[300px] w-full relative">
          {totalMedals > 0 ? (
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
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Sin datos de premios aún
            </div>
          )}

          {totalMedals > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{totalMedals}</span>
              <p className="text-xs text-gray-400">Total Medallas</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-400">{item.name} ({item.value})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
