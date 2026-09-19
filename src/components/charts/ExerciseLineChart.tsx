import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface LineDatum {
  date: string
  label: string
  weight: number | null
  e1rm: number | null
}

export default function ExerciseLineChart({ data, unit }: { data: LineDatum[]; unit: string }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#2c2c2e" />
          <XAxis dataKey="label" tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: 12, color: '#fff' }} labelStyle={{ color: '#8e8e93' }} formatter={(v, name) => [`${Math.round(Number(v) * 10) / 10} ${unit}`, name === 'weight' ? 'Top set' : 'Est. 1RM']} />
          <Line type="monotone" dataKey="e1rm" stroke="#8e8e93" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
