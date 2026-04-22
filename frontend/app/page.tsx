'use client'

import { useState } from 'react'
import { BookingForm } from '@/components/booking/booking-form'
import { BookingCalendar } from '@/components/booking/booking-calendar'
import { BookingConfirmation } from '@/components/booking/booking-confirmation'
import { useData } from '@/lib/data-context'
import { Scissors } from 'lucide-react'
import Link from 'next/link'

type BookingStep = 'form' | 'calendar' | 'confirmation'

interface BookingData {
  clientName: string
  clientPhone: string
  serviceId: string
  date: string
  time: string
}

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('form')
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({})
  const { addAppointment, services } = useData()

  /*const handleFormSubmit = (data: { clientName: string; clientPhone: string; serviceId: string }) => {
    setBookingData(data)
    setStep('calendar')
  } se cambió esto por lo de abajo*/

const handleFormSubmit = async (data: { clientName: string; clientPhone: string; serviceId: string }) => {
  try {

    setBookingData(data)
    setStep('calendar')
  } catch (error) {
    console.error(error)
  }
}

const handleDateTimeSelect = async (date: string, time: string) => {
  const fullData = {
    ...bookingData,
    date,
    time
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(fullData)
    })

    if (!response.ok) {
      throw new Error("Error al guardar turno")
    }

    console.log("Turno guardado completo")

    setBookingData(fullData)
    setStep('confirmation')

  } catch (error) {
    console.error(error)
  }
}

  const handleBack = () => {
    setStep('form')
  }

  const handleNewBooking = () => {
    setBookingData({})
    setStep('form')
  }

  const selectedService = services.find((s) => s.id === bookingData.serviceId)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Scissors className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Original Style</h1>
              <p className="text-xs text-muted-foreground">Sistema de Citas</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Acceso Barbero
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
            Reserva tu Cita
          </h2>
          <p className="text-muted-foreground text-pretty">
            Selecciona el servicio que deseas y elige la fecha y hora que mejor te convenga
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {['form', 'calendar', 'confirmation'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : i < ['form', 'calendar', 'confirmation'].indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < ['form', 'calendar', 'confirmation'].indexOf(step)
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 'form' && <BookingForm onSubmit={handleFormSubmit} initialData={bookingData} />}

        {step === 'calendar' && (
          <BookingCalendar
            onSelect={handleDateTimeSelect}
            onBack={handleBack}
            serviceDuration={selectedService?.duration || 30}
          />
        )}

        {step === 'confirmation' && (
          <BookingConfirmation
            bookingData={bookingData as BookingData}
            service={selectedService!}
            onNewBooking={handleNewBooking}
          />
        )}
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Original Style - Tu barbería de confianza</p>
        </div>
      </footer>
    </div>
  )
}
