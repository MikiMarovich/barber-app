'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo, useEffect, useState } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Scissors,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const CHART_COLORS = [
  'oklch(0.65 0.18 145)',
  'oklch(0.6 0.15 200)',
  'oklch(0.7 0.15 60)',
  'oklch(0.55 0.2 25)',
  'oklch(0.6 0.12 280)',
]

export default function AnalyticsPage() {
  const { services } = useData()
  const [appointmentsFromDB, setAppointmentsFromDB] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [periodFilter, setPeriodFilter] = useState('year')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  

  const getFilteredAppointments = (appointments: any[]) => {
    let result = appointments

    if (selectedMonth) {
      result = result.filter((apt) => {
        const aptDate = new Date(`${apt.date}T00:00:00`)
        const key = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}`
        return key === selectedMonth
      })
    } else {
      const now = new Date()

      result = result.filter((apt) => {
        const aptDate = new Date(`${apt.date}T00:00:00`)

        switch (periodFilter) {
          case 'today':
            return apt.date === now.toISOString().split('T')[0]

          case 'week': {
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay())

            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6)

            return aptDate >= startOfWeek && aptDate <= endOfWeek
          }

          case 'month':
            return (
              aptDate.getMonth() === now.getMonth() &&
              aptDate.getFullYear() === now.getFullYear()
            )

          case 'year':
            return aptDate.getFullYear() === Number(selectedYear)

          case 'all':
          default:
            return true
        }
      })
    }

    if (selectedStaff !== 'all') {
      result = result.filter((apt) => String(apt.staffId) === selectedStaff)
    }

    return result
  }

  const availableYears = useMemo(() => {
    const years = new Set<string>()

    appointmentsFromDB.forEach((apt) => {
      if (apt.date) {
        years.add(String(new Date(`${apt.date}T00:00:00`).getFullYear()))
      }
    })

    const currentYear = String(new Date().getFullYear())
    years.add(currentYear)

    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [appointmentsFromDB])

  const availableStaff = useMemo(() => {
    const map = new Map<string, string>()

    appointmentsFromDB.forEach((apt) => {
      if (apt.staffId && apt.staffName) {
        map.set(String(apt.staffId), apt.staffName)
      }
    })

    return Array.from(map.entries())
  }, [appointmentsFromDB])


    useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((a: any) => ({
          id: a.id.toString(),
          clientName: a.client_name,
          clientPhone: a.client_phone,
          serviceId: a.service_id,
          date: a.date,
          time: a.time,
          status: a.status,
          paymentMethod: a.payment_method,
          staffId: a.staff_id,
          staffName: a.staff_name,
        }))

        setAppointmentsFromDB(mapped)
      })
      .catch((error) => console.error(error))
  }, [])

  const stats = useMemo(() => {
    const filtered = getFilteredAppointments(appointmentsFromDB)

    const completedappointmentsFromDB = filtered.filter((apt) => apt.status === 'completed')
    const pendingappointmentsFromDB = filtered.filter((apt) => apt.status === 'pending')
    const cancelledappointmentsFromDB = filtered.filter((apt) => apt.status === 'cancelled')

    const totalEarnings = completedappointmentsFromDB.reduce((sum, apt) => {
      const service = services.find((s) => s.id === apt.serviceId)
      return sum + (service?.price || 0)
    }, 0)

    const cashTotal = completedappointmentsFromDB.reduce((sum, apt) => {
      if (apt.paymentMethod !== 'cash') return sum
      const service = services.find((s) => s.id === apt.serviceId)
      return sum + (service?.price || 0)
    }, 0)

    const transferTotal = completedappointmentsFromDB.reduce((sum, apt) => {
      if (apt.paymentMethod !== 'transfer') return sum
      const service = services.find((s) => s.id === apt.serviceId)
      return sum + (service?.price || 0)
    }, 0)

    const today = new Date().toISOString().split('T')[0]

    const todayTotal = completedappointmentsFromDB.reduce((sum, apt) => {
      if (apt.date !== today) return sum
      const service = services.find((s) => s.id === apt.serviceId)
      return sum + (service?.price || 0)
    }, 0)

    const avgEarningsPerAppointment = completedappointmentsFromDB.length
      ? totalEarnings / completedappointmentsFromDB.length
      : 0

    return {
      totalEarnings,
      cashTotal,
      transferTotal,
      todayTotal,
      completedCount: completedappointmentsFromDB.length,
      pendingCount: pendingappointmentsFromDB.length,
      cancelledCount: cancelledappointmentsFromDB.length,
      avgEarnings: avgEarningsPerAppointment,
    }
  }, [appointmentsFromDB, services, periodFilter, selectedYear, selectedMonth, selectedStaff])

  const earningsByService = useMemo(() => {
    const filtered = getFilteredAppointments(appointmentsFromDB)
    const completedappointmentsFromDB = filtered.filter((apt) => apt.status === 'completed')
    const earningsMap = new Map<string, { name: string; earnings: number; count: number }>()

    services.forEach((service) => {
      earningsMap.set(service.id, { name: service.name, earnings: 0, count: 0 })
    })

    completedappointmentsFromDB.forEach((apt) => {
      const service = services.find((s) => s.id === apt.serviceId)
      if (service) {
        const current = earningsMap.get(service.id)!
        current.earnings += service.price
        current.count += 1
      }
    })

    return Array.from(earningsMap.values())
      .filter((item) => item.count > 0)
      .sort((a, b) => b.earnings - a.earnings)
  }, [appointmentsFromDB, services, periodFilter, selectedYear, selectedMonth, selectedStaff])

  const monthlyData = useMemo(() => {
    let filtered = appointmentsFromDB.filter((apt) => apt.status === 'completed')

    if (selectedStaff !== 'all') {
      filtered = filtered.filter((apt) => String(apt.staffId) === selectedStaff)
    }

    const completedappointmentsFromDB = filtered
    
  const monthlyMap = new Map<
    string,
    { key: string; month: string; earnings: number; appointmentsFromDB: number }
  >()

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const currentYear = Number(selectedYear)

    months.forEach((month, index) => {
      const key = `${currentYear}-${String(index + 1).padStart(2, '0')}`
      monthlyMap.set(key, { key, month, earnings: 0, appointmentsFromDB: 0 })
    })

    completedappointmentsFromDB.forEach((apt) => {
      const aptDate = new Date(`${apt.date}T00:00:00`)
      if (aptDate.getFullYear() === currentYear) {
        const key = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}`
        const current = monthlyMap.get(key)
        if (current) {
          const service = services.find((s) => s.id === apt.serviceId)
          current.earnings += service?.price || 0
          current.appointmentsFromDB += 1
        }
      }
    })

    return Array.from(monthlyMap.values())
  }, [appointmentsFromDB, services, selectedYear, selectedStaff])

  const statusData = useMemo(() => {
    return [
      { name: 'Completadas', value: stats.completedCount, color: CHART_COLORS[0] },
      { name: 'Pendientes', value: stats.pendingCount, color: CHART_COLORS[1] },
      { name: 'Canceladas', value: stats.cancelledCount, color: CHART_COLORS[3] },
    ].filter((item) => item.value > 0)
  }, [stats])

  const earningsByStaff = useMemo(() => {
    const filtered = getFilteredAppointments(appointmentsFromDB)
    const completedappointmentsFromDB = filtered.filter(
      (apt) => apt.status === 'completed' && apt.staffId
    )

    const staffMap = new Map<
      string,
      { staffName: string; count: number; earnings: number }
    >()

    completedappointmentsFromDB.forEach((apt) => {
      const service = services.find((s) => s.id === apt.serviceId)
      const price = service?.price || 0
      const key = String(apt.staffId)

      if (!staffMap.has(key)) {
        staffMap.set(key, {
          staffName: apt.staffName || 'Sin asignar',
          count: 0,
          earnings: 0,
        })
      }

      const current = staffMap.get(key)!
      current.count += 1
      current.earnings += price
    })

    return Array.from(staffMap.values()).sort((a, b) => b.earnings - a.earnings)
  }, [appointmentsFromDB, services, periodFilter, selectedYear, selectedMonth, selectedStaff])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ganancias Totales</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalEarnings}$</p>
              </div>
              <div className="p-3 bg-chart-1/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efectivo</p>
                <p className="text-3xl font-bold text-foreground">{stats.cashTotal}$</p>
              </div>
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transferencia</p>
                <p className="text-3xl font-bold text-foreground">{stats.transferTotal}$</p>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Hoy</p>
                <p className="text-3xl font-bold text-foreground">{stats.todayTotal}$</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings by Service */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Ganancias por Servicio</CardTitle>
            <CardDescription>Distribución de ingresos por tipo de servicio</CardDescription>
          </CardHeader>
          <CardContent>
            {earningsByService.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsByService} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
                  <XAxis
                    type="number"
                    stroke="oklch(0.65 0 0)"
                    tickFormatter={(value) => `${value}$`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="oklch(0.65 0 0)"
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}$`, 'Ganancias']}
                    contentStyle={{
                      backgroundColor: 'oklch(0.17 0.01 260)',
                      border: '1px solid oklch(0.28 0.01 260)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'oklch(0.95 0 0)' }}
                  />
                  <Bar
                    dataKey="earnings"
                    fill="oklch(0.65 0.18 145)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300ox] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de servicios completados</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Estado de las Citas</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.17 0.01 260)',
                      border: '1px solid oklch(0.28 0.01 260)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'oklch(0.95 0 0)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300ox] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de citas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="text-foreground">Ganancias Mensuales</CardTitle>
              <CardDescription>Evolución de ingresos durante el año</CardDescription>
            </div>

            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-full sm:w-[180ox] bg-input border-border">
                <SelectValue placeholder="Barbero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableStaff.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear}
              onValueChange={(value) => {
                setSelectedYear(value)
                setPeriodFilter('year')
                setSelectedMonth(null)
              }}
            >
              <SelectTrigger className="w-full sm:w-[140ox] bg-input border-border">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-sm text-muted-foreground underline text-left"
            >
              Limpiar selección de mes
            </button>
          )}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={monthlyData}
            onClick={(state: any) => {
              const clickedKey = state?.activePayload?.[0]?.payload?.key
              if (clickedKey) {
                setSelectedMonth(clickedKey)
              }
            }}
          >
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
              <XAxis dataKey="month" stroke="oklch(0.65 0 0)" />
              <YAxis stroke="oklch(0.65 0 0)" tickFormatter={(value) => `${value}$`} />
              <Tooltip
                formatter={(value: number, name) => [
                  name === 'earnings' ? `${value}$` : value,
                  name === 'earnings' ? 'Ganancias' : 'Citas',
                ]}
                contentStyle={{
                  backgroundColor: 'oklch(0.17 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'oklch(0.95 0 0)' }}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="oklch(0.65 0.18 145)"
                strokeWidth={2}
                dot={{ fill: 'oklch(0.65 0.18 145)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Facturación por Barbero</CardTitle>
        <CardDescription>
          Total generado por cada miembro del personal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Barbero
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Servicios
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Facturación
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  % del Total
                </th>
              </tr>
            </thead>
            <tbody>
              {earningsByStaff.length > 0 ? (
                earningsByStaff.map((staff, index) => (
                  <tr
                    key={`${staff.staffName}-${index}`}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-foreground">{staff.staffName}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {staff.count}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground font-medium">
                      {staff.earnings}$
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">
                      {stats.totalEarnings > 0
                        ? ((staff.earnings / stats.totalEarnings) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay datos de personal disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

      {/* Services Performance Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Rendimiento de Servicios</CardTitle>
          <CardDescription>Detalle de cada servicio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Servicio</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Citas</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ganancias</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">% del Total</th>
                </tr>
              </thead>
              <tbody>
                {earningsByService.length > 0 ? (
                  earningsByService.map((service, index) => (
                    <tr key={service.name} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="text-foreground">{service.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">{service.count}</td>
                      <td className="text-right py-3 px-4 text-foreground font-medium">{service.earnings}$</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {stats.totalEarnings > 0
                          ? ((service.earnings / stats.totalEarnings) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
