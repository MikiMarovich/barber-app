'use client'

import { useState, useMemo, useEffect } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  CalendarOff,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function CalendarManagementPage() {
  const { blockedDates, addBlockedDate, removeBlockedDate, appointments, settings, getAvailableSlots } = useData()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)

  const [blockedSlots, setBlockedSlots] = useState<any[]>([])
const [appointmentsFromDB, setAppointmentsFromDB] = useState<any[]>([])

  const authHeaders = (includeJson = false) => {
    const token = localStorage.getItem("barbershop_token")

    return {
      ...(includeJson ? { "Content-Type": "application/json" } : {}),
      "Authorization": `Bearer ${token}`,
    }
  }

  const fetchBlockedSlots = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blocked-slots`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      setBlockedSlots(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchBlockedSlots()
  }, [])

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
        }))

        setAppointmentsFromDB(mapped)
      })
      .catch((error) => console.error(error))
  }, [])

  const getBlockedSlotForDateTime = (date: string, time: string) => {
    return blockedSlots.find(
      (slot) =>
        String(slot.blocked_date).slice(0, 10) === date &&
        slot.blocked_time === time
    )
  }

  const handleBlockSlot = async (date: string, time: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blocked-slots`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          blocked_date: date,
          blocked_time: time,
          reason: "Bloqueado por el barbero"
        })
      })

      if (!response.ok) {
        throw new Error("Error al bloquear horario")
      }

      await fetchBlockedSlots()
    } catch (error) {
      console.error(error)
    }
  }

  const handleUnblockSlot = async (id: number) => {
    try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blocked-slots/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })

      if (!response.ok) {
        throw new Error("Error al desbloquear horario")
      }

      await fetchBlockedSlots()
    } catch (error) {
      console.error(error)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth])

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getDateInfo = (date: Date) => {
    const dateString = formatDateString(date)
    const blocked = blockedDates.find((bd) => bd.date === dateString)

    const dayAppointments = appointmentsFromDB.filter(
      (apt) => apt.date === dateString &&
      apt.status !== 'cancelled'
    )

    const isWorkingDay = settings.workingDays.includes(date.getDay())

    return { blocked, appointmentCount: dayAppointments.length, isWorkingDay }
  }
  const handleDateClick = (date: Date) => {
    if (date < today) return
    setSelectedDate(formatDateString(date))
  }

  const handleBlockDate = () => {
    if (selectedDate) {
      addBlockedDate(selectedDate, blockReason || undefined)
      setBlockReason('')
      setIsBlockDialogOpen(false)
      setSelectedDate(null)
    }
  }

  const handleUnblockDate = (id: string) => {
    removeBlockedDate(id)
    setSelectedDate(null)
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const selectedDateInfo = selectedDate
    ? getDateInfo(new Date(selectedDate + 'T00:00:00'))
    : null

  const daySlots = selectedDate ? getAvailableSlots(selectedDate) : []

  const formatSelectedDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Calendario</CardTitle>
                <CardDescription>Gestiona los días disponibles</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-32 text-center">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="p-2 aspect-square" />
                }

                const dateString = formatDateString(date)
                const { blocked, appointmentCount, isWorkingDay } = getDateInfo(date)
                const isPast = date < today
                const isSelected = dateString === selectedDate
                const isToday = formatDateString(today) === dateString

                return (
                  <button
                    key={dateString}
                    onClick={() => handleDateClick(date)}
                    disabled={isPast}
                    className={`
                      p-2 aspect-square text-sm rounded-lg transition-colors relative flex flex-col items-center justify-center
                      ${isSelected
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : blocked
                          ? 'bg-destructive/20 text-destructive'
                          : !isWorkingDay
                            ? 'bg-muted/50 text-muted-foreground'
                            : isPast
                              ? 'text-muted-foreground/40 cursor-not-allowed'
                              : 'hover:bg-primary/20 text-foreground'
                      }
                      ${isToday && !isSelected ? 'ring-1 ring-primary' : ''}
                    `}
                  >
                    <span>{date.getDate()}</span>
                    {blocked && !isSelected && (
                      <CalendarOff className="h-3 w-3 mt-0.5" />
                    )}
                    {appointmentCount > 0 && (
                      <span
                        className={`text-[10px] mt-0.5 ${
                          blocked ? 'text-destructive' : 'text-primary'
                        }`}
                      >
                        {appointmentCount} cita{appointmentCount > 1 ? 's' : ''} 
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-destructive/20" />
                <span className="text-muted-foreground">Día bloqueado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-muted/50" />
                <span className="text-muted-foreground">Día no laborable</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded ring-1 ring-primary" />
                <span className="text-muted-foreground">Hoy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Info */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalles del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-medium text-foreground capitalize">
                    {formatSelectedDate(selectedDate)}
                  </p>
                </div>

                {selectedDateInfo?.blocked ? (
                  <div className="space-y-4">
                    <Badge variant="destructive" className="w-full justify-center py-2">
                      Día Bloqueado
                    </Badge>
                    {selectedDateInfo.blocked.reason && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Motivo:</p>
                        <p className="text-foreground">{selectedDateInfo.blocked.reason}</p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUnblockDate(selectedDateInfo.blocked!.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Desbloquear Día
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!selectedDateInfo?.isWorkingDay ? (
                      <Badge variant="secondary" className="w-full justify-center py-2">
                        Día No Laborable
                      </Badge>
                    ) : (
                      <>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Citas pendientes:</p>
                          <p className="text-2xl font-bold text-foreground">
                            {selectedDateInfo?.appointmentCount || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Bloqueo por horario</p>

                          <div className="grid grid-cols-2 gap-2">
                            {daySlots.map((time) => {
                              const blockedSlot = getBlockedSlotForDateTime(selectedDate!, time)
                              const isBlocked = !!blockedSlot

                              return (
                                <div
                                  key={time}
                                  className={`flex items-center justify-between p-2 rounded-lg border ${
                                    isBlocked
                                      ? 'bg-destructive/10 border-destructive/20'
                                      : 'bg-muted/50 border-border'
                                  }`}
                                >
                                  <span className="text-sm font-medium text-foreground">{time}</span>

                                  {isBlocked ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUnblockSlot(blockedSlot.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      Levantar
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleBlockSlot(selectedDate!, time)}
                                    >
                                      Bloquear
                                    </Button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              <CalendarOff className="h-4 w-4 mr-2" />
                              Bloquear Día
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border">
                            <DialogHeader>
                              <DialogTitle>Bloquear Fecha</DialogTitle>
                              <DialogDescription>
                                Los clientes no podrán reservar citas en esta fecha.
                                {selectedDateInfo?.appointmentCount
                                  ? ` Hay ${selectedDateInfo.appointmentCount} cita(s) pendiente(s).`
                                  : ''}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="reason">Motivo (opcional)</Label>
                              <Input
                                id="reason"
                                placeholder="Ej: Vacaciones, día festivo..."
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                className="mt-2 bg-input border-border"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button variant="destructive" onClick={handleBlockDate}>
                                Bloquear Fecha
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una fecha para ver los detalles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blocked Dates List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Fechas Bloqueadas</CardTitle>
          <CardDescription>Lista de días no disponibles para reservas</CardDescription>
        </CardHeader>
        <CardContent>
          {blockedDates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {blockedDates
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(blocked.date + 'T00:00:00').toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      {blocked.reason && (
                        <p className="text-sm text-muted-foreground">{blocked.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnblockDate(blocked.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay fechas bloqueadas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
