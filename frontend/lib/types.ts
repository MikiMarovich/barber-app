export interface Service {
  id: string
  name: string
  price: number
  duration: number // in minutes
}

export interface Appointment {
  id: string
  clientName: string
  clientPhone: string
  serviceId: string
  date: string // ISO date string YYYY-MM-DD
  time: string // HH:mm format
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
}

export interface BlockedDate {
  id: string
  date: string // ISO date string YYYY-MM-DD
  reason?: string
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  minStock: number
  price: number
}

export interface BarberSettings {
  workingHours: {
    start: string
    end: string
  }
  workingDays: number[]
  slotDuration: number
  weeklySchedule?: Record<string, { start: string; end: string }[]>
}