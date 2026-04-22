'use client'

import { useState, useMemo, useEffect } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Clock, ArrowLeft } from 'lucide-react'

interface BookingCalendarProps {
  onSelect: (date: string, time: string) => void
  onBack: () => void
  serviceDuration: number
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]



export function BookingCalendar({ onSelect, onBack }: BookingCalendarProps) {
  const { getAvailableSlots, isDateBlocked, settings } = useData()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [blockedSlots, setBlockedSlots] = useState<{ blocked_date: string; blocked_time: string }[]>([])
  const slots = selectedDate ? getAvailableSlots(selectedDate) : []
  const [appointmentsFromDB, setAppointmentsFromDB] = useState<
    { date: string; time: string; status: string }[]
  >([])

  const fetchBlockedSlots = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blocked-slots`)
      const data = await res.json()
      setBlockedSlots(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchBlockedSlots()
  }, [])

  const isSlotBlocked = (date: string, time: string) => {
    return blockedSlots.some(
      (slot) =>
        String(slot.blocked_date).slice(0, 10) === date &&
        slot.blocked_time === time
    )
  }

  const isSlotTaken = (date: string, time: string) => {
    return appointmentsFromDB.some(
      (apt) =>
        apt.date === date &&
        apt.time === time &&
        apt.status !== 'cancelled'
    )
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((a: any) => ({
          date: a.date,
          time: a.time,
          status: a.status,
        }))

        setAppointmentsFromDB(mapped)
      })
      .catch((error) => console.error(error))
  }, [])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/blocked-slots`)
      .then((res) => res.json())
      .then((data) => {
        const dates = data.map((item: any) => item.blocked_date?.slice(0, 10))
        setBlockedDates(dates)
      })
  }, [])




  const isDateBlockedFromDB = (date: string) => {
    return blockedDates.includes(date)
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
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const isDateAvailable = (date: Date): boolean => {
    if (date < today) return false
    const dateString = formatDateString(date)
    if (isDateBlockedFromDB(dateString)) return false
    const dayOfWeek = date.getDay()
    if (!settings.workingDays.includes(dayOfWeek)) return false
    const slots = getAvailableSlots(dateString)
    return slots.length > 0
  }

  const availableSlots = useMemo(() => {
    if (!selectedDate) return []

    const slots = getAvailableSlots(selectedDate)

    return slots.filter(
      (time) =>
        !isSlotBlocked(selectedDate, time) &&
        !isSlotTaken(selectedDate, time)
    )
  }, [selectedDate, getAvailableSlots, blockedSlots, appointmentsFromDB])

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return
    setSelectedDate(formatDateString(date))
    setSelectedTime(null)
  }

  const handleTimeClick = (time: string) => {
    setSelectedTime(time)
  }

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onSelect(selectedDate, selectedTime)
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const canGoPrev = currentMonth.getFullYear() > today.getFullYear() ||
    (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth())

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Selecciona Fecha y Hora</CardTitle>
          <CardDescription>Elige el día y horario que prefieras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevMonth}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold text-foreground">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
                return <div key={`empty-${index}`} className="p-2" />
              }

              const dateString = formatDateString(date)
              const isAvailable = isDateAvailable(date)
              const isSelected = dateString === selectedDate
              const isToday = formatDateString(today) === dateString

              return (
                <button
                  key={dateString}
                  onClick={() => handleDateClick(date)}
                  disabled={!isAvailable}
                  className={`
                    p-2 text-sm rounded-lg transition-colors relative
                    ${isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isAvailable
                        ? 'hover:bg-primary/20 text-foreground'
                        : 'text-muted-foreground/40 cursor-not-allowed'
                    }
                    ${isToday && !isSelected ? 'ring-1 ring-primary' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios Disponibles
            </CardTitle>
            <CardDescription>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? 'default' : 'outline'}
                    onClick={() => handleTimeClick(slot)}
                    className="text-sm"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay horarios disponibles para este día
              </p>
            )}

            {selectedTime && (
              <Button
                onClick={handleConfirm}
                className="w-full mt-6"
                size="lg"
              >
                Confirmar Reserva
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
