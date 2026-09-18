import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface BarDatum {
  label: string
  value: number
}

export default function WeeklyBarChart({ data, format, unitLabel }: { data: BarDatum[]; format: (v: number) => string; unitLabel: string }) {
  const tickEvery = Math.max(1, Math.round(data.length / 6))
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#2c2c2e" />
          <XAxis dataKey="label" tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} interval={tickEvery - 1} />
          <YAxis tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => format(v)} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: 12, color: '#fff' }}
            formatter={(v) => [`${format(Number(v))} ${unitLabel}`.trim(), '']}
            labelStyle={{ color: '#8e8e93' }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
