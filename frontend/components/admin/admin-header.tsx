'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useData } from '@/lib/data-context'

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Panel Principal',
  '/admin/dashboard/appointments': 'Gestión de Citas',
  '/admin/dashboard/calendar': 'Gestión del Calendario',
  '/admin/dashboard/analytics': 'Análisis y Estadísticas',
  '/admin/dashboard/services': 'Servicios y Precios',
  '/admin/dashboard/inventory': 'Inventario',
}

export function AdminHeader() {
  const pathname = usePathname()
  const { appointments } = useData()

  const title = pageTitles[pathname] || 'Panel de Control'

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(
    (apt) => apt.date === today && apt.status === 'pending'
  )

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      <div className="lg:ml-0 ml-12">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {todayAppointments.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {todayAppointments.length}
            </span>
          )}
        </Button>
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-foreground">Barbero</p>
          <p className="text-xs text-muted-foreground">Administrador</p>
        </div>
      </div>
    </header>
  )
}
