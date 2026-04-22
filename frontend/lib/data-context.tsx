'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  type Appointment,
  type BlockedDate,
  type InventoryItem,
} from './types'
import type { Service, BarberSettings } from '@/lib/types'
import { API_URL } from './api'


interface DataContextType {
  appointments: Appointment[]
  services: Service[]
  blockedDates: BlockedDate[]
  inventory: InventoryItem[]
  settings: BarberSettings
  isLoaded: boolean
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => Appointment
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  cancelAppointment: (id: string) => void
  completeAppointment: (id: string) => void
  addService: (service: Omit<Service, 'id'>) => Promise<void>
  updateService: (id: string, updates: Partial<Service>) => Promise<void>
  deleteService: (id: string) => Promise<void>
  addBlockedDate: (date: string, reason?: string) => void
  removeBlockedDate: (id: string) => void
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void
  deleteInventoryItem: (id: string) => void
  updateSettings: (settings: Partial<BarberSettings>) => Promise<void>
  isDateBlocked: (date: string) => boolean
  getAvailableSlots: (date: string) => string[]
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const STORAGE_KEYS = {
  appointments: 'barbershop_appointments',
  services: 'barbershop_services',
  blockedDates: 'barbershop_blocked_dates',
  inventory: 'barbershop_inventory',
  settings: 'barbershop_settings',
  auth: 'barbershop_auth',
}


export function DataProvider({ children }: { children: ReactNode }) {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [settings, setSettings] = useState<BarberSettings>({
      workingHours: {
        start: '10:30',
        end: '21:00',
      },
      workingDays: [2, 3, 4, 5, 6],
      slotDuration: 30,
      weeklySchedule: {
        "2": [
          { start: '10:30', end: '14:00' },
          { start: '17:00', end: '21:00' },
        ],
        "3": [
          { start: '10:30', end: '14:00' },
          { start: '17:00', end: '21:00' },
        ],
        "4": [
          { start: '10:30', end: '14:00' },
          { start: '17:00', end: '21:00' },
        ],
        "5": [
          { start: '10:30', end: '21:00' },
        ],
        "6": [
          { start: '10:30', end: '21:00' },
        ],
      },
    })
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const authHeaders = (includeJson = false) => {
    const token = localStorage.getItem("barbershop_token")

      return {
        ...(includeJson ? { "Content-Type": "application/json" } : {}),
        "Authorization": `Bearer ${token}`,
      }
    }
      

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const storedAppointments = localStorage.getItem(STORAGE_KEYS.appointments)
        const storedBlockedDates = localStorage.getItem(STORAGE_KEYS.blockedDates)
        const storedInventory = localStorage.getItem(STORAGE_KEYS.inventory)
        const storedAuth = localStorage.getItem(STORAGE_KEYS.auth)

        if (storedAppointments) setAppointments(JSON.parse(storedAppointments))
        if (storedBlockedDates) setBlockedDates(JSON.parse(storedBlockedDates))
        if (storedInventory) setInventory(JSON.parse(storedInventory))
        if (storedAuth === 'true') setIsAuthenticated(true)
      } catch (error) {
        console.error('Error loading data from localStorage:', error)
      }
      setIsLoaded(true)
    }
    loadData()
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((service: any) => ({
          id: String(service.id),
          name: service.name,
          price: Number(service.price),
          duration: Number(service.duration),
        }))

        setServices(mapped)
      })
      .catch((error) => console.error("Error loading services:", error))
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          workingHours: {
            start: data.workingHours.start,
            end: data.workingHours.end,
          },
          workingDays: data.workingDays,
          slotDuration: Number(data.slotDuration),
          weeklySchedule: data.weeklySchedule || {},
        })
      })
      .catch((error) => console.error("Error loading settings:", error))
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/appointments`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((a: any) => ({
          id: String(a.id),
          clientName: a.client_name,
          clientPhone: a.client_phone,
          serviceId: a.service_id,
          date: a.date,
          time: a.time,
          status: a.status,
          createdAt: a.created_at || '',
        }))

        setAppointments(mapped)
      })
      .catch((error) => console.error("Error loading appointments:", error))
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments))
  }, [appointments, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(STORAGE_KEYS.blockedDates, JSON.stringify(blockedDates))
  }, [blockedDates, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory))
  }, [inventory, isLoaded])

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        localStorage.removeItem(STORAGE_KEYS.auth)
        localStorage.removeItem("barbershop_token")
        setIsAuthenticated(false)
        return false
      }

      const data = await res.json()

      localStorage.setItem(STORAGE_KEYS.auth, 'true')
      localStorage.setItem("barbershop_token", data.token)
      setIsAuthenticated(true)

      return true
    } catch (error) {
      console.error("Login error:", error)
      localStorage.removeItem(STORAGE_KEYS.auth)
      localStorage.removeItem("barbershop_token")
      setIsAuthenticated(false)
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(STORAGE_KEYS.auth)
    localStorage.removeItem("barbershop_token")
  }
  
  const addAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Appointment => {
    const newAppointment: Appointment = {
      ...appointment,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setAppointments((prev) => [...prev, newAppointment])
    return newAppointment
  }

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, ...updates } : apt))
    )
  }

  const cancelAppointment = (id: string) => {
    updateAppointment(id, { status: 'cancelled' })
  }

  const completeAppointment = (id: string) => {
    updateAppointment(id, { status: 'completed' })
  }

  const addService = async (service: Omit<Service, 'id'>) => {
    await fetch(`${API_URL}/services`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        name: service.name,
        price: service.price,
        duration: service.duration,
        active: true,
      }),
    })

    const res = await fetch(`${API_URL}/services`, {
      headers: authHeaders(),
    })
    const data = await res.json()

    const mapped = data.map((s: any) => ({
      id: String(s.id),
      name: s.name,
      price: Number(s.price),
      duration: Number(s.duration),
    }))

    setServices(mapped)
  }

  const updateService = async (id: string, updates: Partial<Service>) => {
    const current = services.find((s) => s.id === id)
    if (!current) return

    const updated = { ...current, ...updates }

    await fetch(`${API_URL}/services/${id}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({
        name: updated.name,
        price: updated.price,
        duration: updated.duration,
        active: true,
      }),
    })

    const res = await fetch(`${API_URL}/services`, {
      headers: authHeaders(),
    })
    const data = await res.json()

    const mapped = data.map((s: any) => ({
      id: String(s.id),
      name: s.name,
      price: Number(s.price),
      duration: Number(s.duration),
    }))

    setServices(mapped)
  }

  const deleteService = async (id: string) => {
    await fetch(`${API_URL}/services/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })

    const res = await fetch(`${API_URL}/services`, {
      headers: authHeaders(),
    })
    const data = await res.json()

    const mapped = data.map((s: any) => ({
      id: String(s.id),
      name: s.name,
      price: Number(s.price),
      duration: Number(s.duration),
    }))

    setServices(mapped)
  }

  const addBlockedDate = (date: string, reason?: string) => {
    const newBlockedDate: BlockedDate = {
      id: crypto.randomUUID(),
      date,
      reason,
    }
    setBlockedDates((prev) => [...prev, newBlockedDate])
  }

  const removeBlockedDate = (id: string) => {
    setBlockedDates((prev) => prev.filter((bd) => bd.id !== id))
  }

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
    }
    setInventory((prev) => [...prev, newItem])
  }

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id))
  }

  const updateSettings = async (newSettings: Partial<BarberSettings>) => {
    const updated = { ...settings, ...newSettings }

    await fetch(`${API_URL}/settings`, {
      method: "PUT",
      headers: authHeaders(true),
          body: JSON.stringify(updated),
        })

    const res = await fetch(`${API_URL}/settings`, {
      headers: authHeaders(),
    })
    const data = await res.json()

    setSettings({
      workingHours: {
        start: data.workingHours.start,
        end: data.workingHours.end,
      },
      workingDays: data.workingDays,
      slotDuration: Number(data.slotDuration),
      weeklySchedule: data.weeklySchedule || {},
    })
      }

  const isDateBlocked = (date: string): boolean => {
    return blockedDates.some((bd) => bd.date === date)
  }

  const getAvailableSlots = (date: string): string[] => {
    if (isDateBlocked(date)) return []

    const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
    if (!settings.workingDays.includes(dayOfWeek)) return []

    const bookedSlots = appointments
      .filter((apt) => apt.date === date && apt.status !== 'cancelled')
      .map((apt) => apt.time)

    const daySchedule =
      settings.weeklySchedule?.[String(dayOfWeek)] || [
        {
          start: settings.workingHours.start,
          end: settings.workingHours.end,
        },
      ]

    const slots: string[] = []

    for (const range of daySchedule) {
      const [startHour, startMinute] = range.start.split(':').map(Number)
      const [endHour, endMinute] = range.end.split(':').map(Number)

      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute

      for (let time = startTime; time <= endTime; time += settings.slotDuration) {
        const hours = Math.floor(time / 60)
        const minutes = time % 60
        const slot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

        if (!bookedSlots.includes(slot) && !slots.includes(slot)) {
          slots.push(slot)
        }
      }
    }

    return slots.sort()
  }

  return (
    <DataContext.Provider
      value={{
        appointments,
        services,
        blockedDates,
        inventory,
        settings,
        isLoaded,
        addAppointment,
        updateAppointment,
        cancelAppointment,
        completeAppointment,
        addService,
        updateService,
        deleteService,
        addBlockedDate,
        removeBlockedDate,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        updateSettings,
        isDateBlocked,
        getAvailableSlots,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
