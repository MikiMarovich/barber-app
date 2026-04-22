'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, Scissors, User, Phone } from 'lucide-react'
import type { Service } from '@/lib/types'

interface BookingData {
  clientName: string
  clientPhone: string
  serviceId: string
  date: string
  time: string
}

interface BookingConfirmationProps {
  bookingData: BookingData
  service: Service
  onNewBooking: () => void
}

export function BookingConfirmation({ bookingData, service, onNewBooking }: BookingConfirmationProps) {
  const formattedDate = new Date(bookingData.date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Card className="border-border bg-card">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl text-foreground">Reserva Confirmada</CardTitle>
        <CardDescription>
          Tu cita ha sido registrada exitosamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium text-foreground">{bookingData.clientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium text-foreground">{bookingData.clientPhone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scissors className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Servicio</p>
              <p className="font-medium text-foreground">{service.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium text-foreground capitalize">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hora</p>
              <p className="font-medium text-foreground">{bookingData.time}</p>
            </div>
          </div>
        </div>

        <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total a pagar</p>
              <p className="text-sm text-muted-foreground">Duración: {service.duration} min</p>
            </div>
            <p className="text-3xl font-bold text-primary">${service.price}</p>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Te esperamos en la fecha y hora indicada.</p>
          <p>Si necesitas cancelar o modificar tu cita, contáctanos.</p>
        </div>

        <Button onClick={onNewBooking} variant="outline" className="w-full" size="lg">
          Hacer otra reserva
        </Button>
      </CardContent>
    </Card>
  )
}
