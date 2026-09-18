import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface MeasureDatum {
  label: string
  value: number | null
}

export default function MeasureLineChart({ data, unit, band }: { data: MeasureDatum[]; unit: string; band?: [number, number] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#2c2c2e" />
          <XAxis dataKey="label" tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
          {band && <ReferenceArea y1={band[0]} y2={band[1]} fill="#30d158" fillOpacity={0.12} />}
          <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: 12, color: '#fff' }} labelStyle={{ color: '#8e8e93' }} formatter={(v) => [`${Math.round(Number(v) * 10) / 10} ${unit}`, '']} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
