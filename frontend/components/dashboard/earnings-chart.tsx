'use client'

import { useMemo } from 'react'
import { useData } from '@/lib/data-context'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function EarningsChart({ appointmentsFromDB }: any) {
  const { services } = useData()

const data = useMemo(() => {
  const earningsByDay: Record<string, number> = {}

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  appointmentsFromDB.forEach((apt: any) => {
    if (apt.status !== 'completed') return
    if (!apt.date) return

    const aptDate = new Date(`${String(apt.date).slice(0, 10)}T00:00:00`)

    if (aptDate.getMonth() !== currentMonth) return
    if (aptDate.getFullYear() !== currentYear) return

    const service = services.find((s) => s.id === apt.serviceId)
    const price = Number(service?.price || 0)

    const normalizedDate = String(apt.date).slice(0, 10)

    if (!earningsByDay[normalizedDate]) {
      earningsByDay[normalizedDate] = 0
    }

    earningsByDay[normalizedDate] += price
  })

  return Object.entries(earningsByDay)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}, [appointmentsFromDB, services])

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
                const d = new Date(`${date}T00:00:00`)
                return d.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
                })
            }}
            />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`€${value}`, 'Ganancias']}
            />
          <Line 
            type="monotone" 
            dataKey="total" 
            strokeWidth={3} 
            dot={{ r: 4 }} 
            />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}