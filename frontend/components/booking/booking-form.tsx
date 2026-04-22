'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Phone, Scissors } from 'lucide-react'

interface BookingFormProps {
  onSubmit: (data: { clientName: string; clientPhone: string; serviceId: string }) => void
  initialData?: Partial<{ clientName: string; clientPhone: string; serviceId: string }>
}

export function BookingForm({ onSubmit, initialData = {} }: BookingFormProps) {
  const { services } = useData()
  const [clientName, setClientName] = useState(initialData.clientName || '')
  const [clientPhone, setClientPhone] = useState(initialData.clientPhone || '')
  const [serviceId, setServiceId] = useState(initialData.serviceId || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!clientName.trim()) {
      newErrors.clientName = 'El nombre es requerido'
    }

    if (!clientPhone.trim()) {
      newErrors.clientPhone = 'El teléfono es requerido'
    } else if (!/^[0-9+\-\s()]{7,15}$/.test(clientPhone.trim())) {
      newErrors.clientPhone = 'Ingresa un número de teléfono válido'
    }

    if (!serviceId) {
      newErrors.serviceId = 'Selecciona un servicio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({ clientName: clientName.trim(), clientPhone: clientPhone.trim(), serviceId })
    }
  }

  const selectedService = services.find((s) => s.id === serviceId)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Información Personal</CardTitle>
        <CardDescription>Completa tus datos y selecciona el servicio deseado</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-foreground">
              Nombre Completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="clientName"
                type="text"
                placeholder="Tu nombre"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            {errors.clientName && (
              <p className="text-sm text-destructive">{errors.clientName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone" className="text-foreground">
              Número de Teléfono
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="clientPhone"
                type="tel"
                placeholder="+54 600 000 000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            {errors.clientPhone && (
              <p className="text-sm text-destructive">{errors.clientPhone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service" className="text-foreground">
              Servicio
            </Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="bg-input border-border">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecciona un servicio" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span>{service.name}</span>
                      <span className="text-muted-foreground text-sm">
                        ${service.price} - {service.duration} min
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-sm text-destructive">{errors.serviceId}</p>
            )}
          </div>

          {selectedService && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{selectedService.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Duración: {selectedService.duration} minutos
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">${selectedService.price}</p>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
