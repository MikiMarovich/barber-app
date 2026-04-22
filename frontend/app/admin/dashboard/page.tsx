'use client'


import { useMemo, useEffect, useState } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import EarningsChart from '@/components/dashboard/earnings-chart'
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'



export default function DashboardPage() {
  const { services } = useData()
  const [appointmentsFromDB, setAppointmentsFromDB] = useState<any[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`)
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((a: any) => ({
          id: a.id.toString(),
          clientName: a.client_name,
          clientPhone: a.client_phone,
          serviceId: a.service_id,
          date: a.date,
          time: a.time,
          status: a.status
        }))

        setAppointmentsFromDB(mapped)
      })
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const stats = useMemo(() => {
    const todayappointmentsFromDB = appointmentsFromDB.filter(
      (apt) => apt.date === today && apt.status !== 'cancelled'
    )

    const completedappointmentsFromDB = appointmentsFromDB.filter((apt) => apt.status === 'completed')

    const totalEarnings = completedappointmentsFromDB.reduce((sum, apt) => {
      const service = services.find((s) => s.id === apt.serviceId)
      return sum + (service?.price || 0)
    }, 0)

    const pendingappointmentsFromDB = appointmentsFromDB.filter((apt) => apt.status === 'pending')

    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const thisWeekEnd = new Date(thisWeekStart)
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6)

    const weekappointmentsFromDB = appointmentsFromDB.filter((apt) => {
      const aptDate = new Date(apt.date)
      return aptDate >= thisWeekStart && aptDate <= thisWeekEnd && apt.status !== 'cancelled'
    })

    return {
      todayCount: todayappointmentsFromDB.length,
      totalEarnings,
      totalappointmentsFromDB: completedappointmentsFromDB.length,
      pendingCount: pendingappointmentsFromDB.length,
      weekCount: weekappointmentsFromDB.length,
    }
  }, [appointmentsFromDB, services, today])

  const upcomingappointmentsFromDB = useMemo(() => {
    return appointmentsFromDB
      .filter((apt) => apt.status === 'pending' && apt.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.time.localeCompare(b.time)
      })
      .slice(0, 5)
  }, [appointmentsFromDB, today])

  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00')
    if (date === today) return 'Hoy'
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date === tomorrow.toISOString().split('T')[0]) return 'Mañana'
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Citas Hoy</p>
                <p className="text-3xl font-bold text-foreground">{stats.todayCount}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

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
                <p className="text-sm text-muted-foreground">Citas Completadas</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalappointmentsFromDB}</p>
              </div>
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Users className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Esta Semana</p>
                <p className="text-3xl font-bold text-foreground">{stats.weekCount}</p>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Próximas Citas</CardTitle>
            <CardDescription>Citas pendientes más cercanas</CardDescription>
          </div>
          <Link href="/admin/dashboard/appointments">
            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingappointmentsFromDB.length > 0 ? (
            <div className="space-y-3">
              {upcomingappointmentsFromDB.map((apt) => {
                const service = services.find((s) => s.id === apt.serviceId)
                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{apt.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {service?.name} - {apt.clientPhone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{formatDate(apt.date)}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{apt.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay citas pendientes</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Ganancias por día</CardTitle>
          <CardDescription>Ingresos basados en citas completadas</CardDescription>
        </CardHeader>
        <CardContent>
          <EarningsChart appointmentsFromDB={appointmentsFromDB} />
        </CardContent>
      </Card>
            

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/dashboard/calendar">
          <Card className="border-border bg-card hover:bg-card/80 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Gestionar Calendario</p>
                <p className="text-sm text-muted-foreground">Bloquear fechas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/dashboard/services">
          <Card className="border-border bg-card hover:bg-card/80 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="font-medium text-foreground">Editar Servicios</p>
                <p className="text-sm text-muted-foreground">Precios y duración</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/dashboard/analytics">
          <Card className="border-border bg-card hover:bg-card/80 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ver Análisis</p>
                <p className="text-sm text-muted-foreground">Estadísticas</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
