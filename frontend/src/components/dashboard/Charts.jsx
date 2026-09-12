import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const axis = { stroke: "#9C9CA3", fontSize: 11 };
const grid = "#EDEDE9";
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E5E5E1",
  boxShadow: "0 12px 32px -12px rgba(16,16,20,0.25)",
  fontSize: 12,
};
export function TasksTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D5B4F" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#1D5B4F" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={axis} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={axis}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#D3D3CD" }} />
        <Area
          type="monotone"
          dataKey="total"
          name="Tasks logged"
          stroke="#C4C4BE"
          strokeWidth={1.5}
          fill="none"
        />

        <Area
          type="monotone"
          dataKey="completed"
          name="Tasks completed"
          stroke="#1D5B4F"
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
export function WorkloadChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
        barSize={16}
      >
        <CartesianGrid stroke={grid} horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={axis}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="project"
          tickLine={false}
          axisLine={false}
          tick={{ ...axis, fontSize: 12 }}
          width={132}
        />

        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F2F2EF" }} />
        <Bar
          dataKey="tasks"
          name="Tasks"
          fill="#17171A"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
const hoursColors = ["#1D5B4F", "#2F7D6C", "#4E9A88", "#8FBDB0", "#C6DBD3"];
export function HoursByTypeChart({ data }) {
  const total = data.reduce((s, d) => s + d.hours, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="hours"
              nameKey="type"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.type}
                  fill={hoursColors[index % hoursColors.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2">
        {data.map((slice, index) => (
          <li
            key={slice.type}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="flex items-center gap-2 text-ink-soft">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: hoursColors[index % hoursColors.length],
                }}
                aria-hidden="true"
              />

              {slice.type}
            </span>
            <span className="tnum text-ink-muted">
              {slice.hours}h
              <span className="ml-1.5 text-ink-faint">
                {total ? Math.round((slice.hours / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
