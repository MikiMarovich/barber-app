'use client'

import { useEffect } from 'react'
import { useState, useMemo } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Calendar,
  Clock,
  Phone,
  User,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react'
import type { Appointment } from '@/lib/types'

export default function AppointmentsPage() {
  const {
    services,
    updateAppointment,
    cancelAppointment,
    getAvailableSlots,
  } = useData()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editServiceId, setEditServiceId] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [appointmentsFromDB, setAppointmentsFromDB] = useState<any[]>([])
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [appointmentToComplete, setAppointmentToComplete] = useState<any | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [staffId, setStaffId] = useState('')
  const [staffList, setStaffList] = useState<any[]>([])
  const currentDate = new Date()
  const [monthFilter, setMonthFilter] = useState<string>(String(currentDate.getMonth() + 1).padStart(2, '0'))
  const [yearFilter, setYearFilter] = useState<string>(String(currentDate.getFullYear()))

  const authHeaders = (includeJson = false) => {
    const token = localStorage.getItem("barbershop_token")

    return {
      ...(includeJson ? { "Content-Type": "application/json" } : {}),
      "Authorization": `Bearer ${token}`,
    }
  }

  const handleConfirmComplete = async () => {
    if (!appointmentToComplete || !paymentMethod || !staffId) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentToComplete.id}/complete`,
        {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify({
            payment_method: paymentMethod,
            staff_id: Number(staffId)
          })
        }
      )

      if (!response.ok) {
        throw new Error("Error al completar turno")
      }

      setCompleteDialogOpen(false)
      setAppointmentToComplete(null)
      window.location.reload()
    } catch (error) {
      console.error(error)
    }
  }


  const handleCompleteClick = (appointment: any) => {
    setAppointmentToComplete(appointment)
    setPaymentMethod('')
    setStaffId('')
    setCompleteDialogOpen(true)
  }

  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`)
      .then((res) => res.json())
      .then((data) => {
        setStaffList(data)
      })
      .catch((error) => console.error(error))
  }, [])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`)
      .then(res => res.json())
      .then(data => {
        console.log("Turnos desde DB:", data)

        // Adaptamos nombres de backend → frontend
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
  }, [])
  
  const availableYears = useMemo(() => {
    const years = new Set<string>()

    appointmentsFromDB.forEach((apt) => {
      if (apt.date) {
        years.add(String(new Date(`${apt.date}T00:00:00`).getFullYear()))
      }
    })

    years.add(String(currentDate.getFullYear()))

    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [appointmentsFromDB, currentDate])


const filteredAppointments = useMemo(() => {
  return appointmentsFromDB
  .filter((apt) => {
    const aptDate = new Date(`${apt.date}T00:00:00`)
    const aptMonth = String(aptDate.getMonth() + 1).padStart(2, '0')
    const aptYear = String(aptDate.getFullYear())

    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.clientPhone.includes(searchTerm)
  

    const matchesStatus =
      statusFilter === 'all' || apt.status === statusFilter

    const matchesPayment =
      paymentFilter === 'all' || apt.paymentMethod === paymentFilter

    const matchesStaff =
      staffFilter === 'all' || String(apt.staffId) === staffFilter
    
    const matchesMonth = aptMonth === monthFilter
    const matchesYear = aptYear === yearFilter
      

    return matchesSearch && matchesStatus && matchesPayment && matchesStaff && matchesMonth && matchesYear
  })
    .sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === 'cancelled') return 1
        if (b.status === 'cancelled') return -1
      }

      const dateA = a.date || ''
      const dateB = b.date || ''
      if (dateA !== dateB) return dateB.localeCompare(dateA)

      return (b.time || '').localeCompare(a.time || '')
    })
}, [appointmentsFromDB, searchTerm, statusFilter, paymentFilter, staffFilter, monthFilter, yearFilter])

  const availableSlots = useMemo(() => {
    if (!editDate) return []
    const slots = getAvailableSlots(editDate)
    // Add current time slot if editing
    if (editingAppointment && editingAppointment.date === editDate) {
      if (!slots.includes(editingAppointment.time)) {
        slots.push(editingAppointment.time)
        slots.sort()
      }
    }
    return slots
  }, [editDate, getAvailableSlots, editingAppointment])

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setEditDate(appointment.date)
    setEditTime(appointment.time)
    setEditServiceId(String(appointment.serviceId))
  }

  const handleSaveEdit = async () => {
    if (editingAppointment && editDate && editTime) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${editingAppointment.id}`, {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify({
            date: editDate,
            time: editTime,
            service_id: editServiceId
          })
        })

        if (!response.ok) {
          throw new Error("Error al actualizar turno")
        }

        console.log("Turno actualizado en DB")

        // 🔥 refrescar datos
        window.location.reload()

      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}/cancel`, {
        method: "PUT",
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error("Error al cancelar turno")
      }

      console.log("Turno cancelado en DB")

      // 🔥 refrescar lista
      window.location.reload()

    } catch (error) {
      console.error(error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'completed':
        return <Badge className="bg-chart-1 text-chart-1-foreground">Completada</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return null
    }
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const today = new Date().toISOString().split('T')[0]
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-input border-border">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>

              <SelectTrigger className="w-full sm:w-44 bg-input border-border">
                <SelectValue placeholder="Medio de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pagos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-input border-border">
                <SelectValue placeholder="Personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el personal</SelectItem>
                {staffList.map((person) => (
                  <SelectItem key={person.id} value={String(person.id)}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-input border-border">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">Enero</SelectItem>
                <SelectItem value="02">Febrero</SelectItem>
                <SelectItem value="03">Marzo</SelectItem>
                <SelectItem value="04">Abril</SelectItem>
                <SelectItem value="05">Mayo</SelectItem>
                <SelectItem value="06">Junio</SelectItem>
                <SelectItem value="07">Julio</SelectItem>
                <SelectItem value="08">Agosto</SelectItem>
                <SelectItem value="09">Septiembre</SelectItem>
                <SelectItem value="10">Octubre</SelectItem>
                <SelectItem value="11">Noviembre</SelectItem>
                <SelectItem value="12">Diciembre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-input border-border">
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
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Citas</CardTitle>
          <CardDescription>
            {filteredAppointments.length} citas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length > 0 ? (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => {
                const service = services.find((s) => s.id === apt.serviceId)
                const isPast = apt.date < today
                const isToday = apt.date === today

                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-lg border transition-colors
                      ${apt.status === 'cancelled'
                        ? 'bg-red-100 border-red-300 opacity-70'
                        : 'bg-muted/50 border-border hover:border-primary/30'}
                    `}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground">{apt.clientName}</p>
                            {getStatusBadge(apt.status)}
                            {isToday && apt.status === 'pending' && (
                              <Badge variant="outline" className="border-primary text-primary">
                                Hoy
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {apt.clientPhone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(apt.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {apt.time}
                            </span>
                          </div>
                          <p className="text-sm text-primary">
                            {service?.name} - {service?.price}$
                          </p>
                        </div>
                      </div>

                      {apt.status === 'pending' && (
                        <div className="flex flex-wrap justify-start lg:justify-end items-center gap-2 w-full lg:w-auto lg:ml-auto">
                          {!isPast && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteClick(apt)}
                              className="text-chart-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Completar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(apt)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(apt.id)}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                        )}
                        <div className="w-full lg:w-[140px] text-left lg:text-right">
                          <p className="text-xs text-muted-foreground">Atendió</p>
                          <p className="text-sm font-medium text-foreground">
                            {apt.staffName || '-'}
                          </p>

                          {apt.paymentMethod && (
                            <>
                              <p className="text-xs text-muted-foreground mt-2">Pago</p>
                              <p className="text-sm text-foreground">
                                {apt.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                              </p>
                            </>
                          )}
                        </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron citas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Modifica la fecha y hora de la cita de {editingAppointment?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Servicio</Label>
            <Select value={editServiceId} onValueChange={setEditServiceId}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={String(service.id)}>
                    {service.name} - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => {
                  setEditDate(e.target.value)
                  setEditTime('')
                }}
                min={today}
                className="bg-input border-border"
              />
            </div>
            {editDate && (
              <div className="space-y-2">
                <Label>Hora</Label>
                <Select value={editTime} onValueChange={setEditTime}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecciona una hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No hay horarios disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAppointment(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editDate || !editTime || !editServiceId}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Cancelar Cita</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cancelar Cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Appointment Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Completar servicio</DialogTitle>
            <DialogDescription>
              Selecciona el medio de pago y quién realizó el trabajo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Medio de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecciona un medio de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Personal</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecciona quién realizó el trabajo" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((person) => (
                    <SelectItem key={person.id} value={String(person.id)}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCompleteDialogOpen(false)
                setAppointmentToComplete(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmComplete}
              disabled={!paymentMethod || !staffId}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
