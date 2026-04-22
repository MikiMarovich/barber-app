'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
} from 'lucide-react'
import type { InventoryItem } from '@/lib/types'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sellItem, setSellItem] = useState<InventoryItem | null>(null)
  const [sellQuantity, setSellQuantity] = useState('')
  const [sellStaffId, setSellStaffId] = useState('')
  const [staffList, setStaffList] = useState<any[]>([])
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false)
  const [salesHistory, setSalesHistory] = useState<any[]>([])

  const currentDate = new Date()
  const [salesMonthFilter, setSalesMonthFilter] = useState(
    String(currentDate.getMonth() + 1).padStart(2, '0')
  )
  const [salesYearFilter, setSalesYearFilter] = useState(
    String(currentDate.getFullYear())
  )
  const [salesStaffFilter, setSalesStaffFilter] = useState('all')

  const authHeaders = (includeJson = false) => {
    const token = localStorage.getItem("barbershop_token")

    return {
      ...(includeJson ? { "Content-Type": "application/json" } : {}),
      "Authorization": `Bearer ${token}`,
    }
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          quantity: item.quantity,
          minStock: item.min_stock,
          price: item.price,
        }))

        setInventory(mapped)
      })
      .catch(console.error)
  }, [])
  
  const fetchSalesHistory = async () => {
    try {
      const params = new URLSearchParams()

      if (salesMonthFilter) params.append('month', String(Number(salesMonthFilter)))
      if (salesYearFilter) params.append('year', salesYearFilter)
      if (salesStaffFilter !== 'all') params.append('staff_id', salesStaffFilter)

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/sales?${params.toString()}`, {
    headers: authHeaders(),
  })
      const data = await res.json()
      setSalesHistory(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (salesHistoryOpen) {
      fetchSalesHistory()
    }
  }, [salesHistoryOpen, salesMonthFilter, salesYearFilter, salesStaffFilter])

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    minStock: '',
    price: '',
  })

  const resetForm = () => {
    setFormData({ name: '', quantity: '', minStock: '', price: '' })
  }

  const handleAddItem = async () => {
    if (formData.name && formData.quantity && formData.minStock && formData.price) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          name: formData.name,
          quantity: parseInt(formData.quantity),
          minStock: parseInt(formData.minStock),
          price: parseFloat(formData.price),
        })
      })

      window.location.reload()
    }
  }

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      minStock: item.minStock.toString(),
      price: item.price.toString(),
    })
  }

  const handleUpdateItem = async () => {
    if (editingItem && formData.name && formData.quantity && formData.minStock && formData.price) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${editingItem.id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({
          name: formData.name,
          quantity: parseInt(formData.quantity),
          minStock: parseInt(formData.minStock),
          price: parseFloat(formData.price),
        })
      })

      window.location.reload()
    }
  }
  const handleDeleteItem = async (id: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })

    setDeleteConfirm(null)
    window.location.reload()
  }

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = inventory.filter((item) => item.quantity <= item.minStock)

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    years.add(String(currentDate.getFullYear()))
    years.add(String(currentDate.getFullYear() - 1))
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [currentDate])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`)
      .then(res => res.json())
      .then(data => setStaffList(data))
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventario</h2>
          <p className="text-muted-foreground">Gestiona los productos de tu barbería</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
        <Button
          variant="outline"
          onClick={() => setSalesHistoryOpen(true)}
          className="w-full sm:w-auto"
        >
          Historial de ventas
        </Button>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Producto</DialogTitle>
              <DialogDescription>
                Completa los detalles del nuevo producto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input
                  id="name"
                  placeholder="Ej: Cera para cabello"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Stock Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio de Compra (€)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="8.50"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={!formData.name || !formData.quantity || !formData.minStock || !formData.price}
              >
                Añadir Producto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Los siguientes productos necesitan reposición:
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Badge key={item.id} variant="destructive">
                  {item.name} ({item.quantity} unidades)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Productos</CardTitle>
          <CardDescription>{filteredInventory.length} productos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventory.length > 0 ? (
<>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Producto</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Cantidad</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Stock Mín.</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Precio</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const isLowStock = item.quantity <= item.minStock
                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-foreground font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">{item.quantity}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{item.minStock}</td>
                      <td className="text-right py-3 px-4 text-foreground">{item.price}€</td>
                      <td className="text-right py-3 px-4">
                        {isLowStock ? (
                          <Badge variant="destructive">Stock Bajo</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-chart-1/20 text-chart-1">OK</Badge>
                        )}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSellItem(item)
                              setSellQuantity('')
                              setSellStaffId('')
                            }}
                          >
                            💰
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredInventory.map((item) => {
              const isLowStock = item.quantity <= item.minStock

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-muted/40 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground break-words">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.price}€</p>
                      </div>
                    </div>

                    {isLowStock ? (
                      <Badge variant="destructive" className="shrink-0">Stock Bajo</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-chart-1/20 text-chart-1 shrink-0">
                        OK
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-background/60 p-3">
                      <p className="text-muted-foreground text-xs">Cantidad</p>
                      <p className="text-foreground font-medium">{item.quantity}</p>
                    </div>
                    <div className="rounded-md bg-background/60 p-3">
                      <p className="text-muted-foreground text-xs">Stock mín.</p>
                      <p className="text-foreground font-medium">{item.minStock}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[90px]"
                      onClick={() => {
                        setSellItem(item)
                        setSellQuantity('')
                        setSellStaffId('')
                      }}
                    >
                      Vender
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[90px]"
                      onClick={() => handleEditClick(item)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[90px] text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
          ) : (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos en el inventario'}
              </p>
              {!searchTerm && (
                <Button
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Primer Producto
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica los detalles del producto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Producto</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Cantidad</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minStock">Stock Mínimo</Label>
                <Input
                  id="edit-minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Precio de Compra (€)</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-input border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateItem}
              disabled={!formData.name || !formData.quantity || !formData.minStock || !formData.price}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteItem(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!sellItem} onOpenChange={() => setSellItem(null)}>
  <DialogContent className="bg-card border-border">
    <DialogHeader>
      <DialogTitle>Vender Producto</DialogTitle>
      <DialogDescription>
        {sellItem?.name}
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Cantidad</Label>
        <Input
          type="number"
          min="1"
          value={sellQuantity}
          onChange={(e) => setSellQuantity(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Barbero</Label>
          <Select value={sellStaffId} onValueChange={setSellStaffId}>
            <SelectTrigger className="w-full bg-input border-border">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setSellItem(null)}>
        Cancelar
      </Button>

      <Button
        onClick={async () => {
          if (!sellItem || !sellQuantity || !sellStaffId) return

          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/sell`, {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify({
              product_id: sellItem.id,
              quantity: Number(sellQuantity),
              staff_id: Number(sellStaffId),
            }),
          })

          window.location.reload()
        }}
      >
        Confirmar Venta
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    <Dialog open={salesHistoryOpen} onOpenChange={setSalesHistoryOpen}>
  <DialogContent className="bg-card border-border w-[95vw] max-w-4xl">
    <DialogHeader>
      <DialogTitle>Historial de ventas</DialogTitle>
      <DialogDescription>
        Consulta las ventas realizadas por período y barbero
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Mes</Label>
          <Select value={salesMonthFilter} onValueChange={setSalesMonthFilter}>
            <SelectTrigger className="bg-input border-border">
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
        </div>

        <div className="space-y-2">
          <Label>Año</Label>
          <Select value={salesYearFilter} onValueChange={setSalesYearFilter}>
            <SelectTrigger className="bg-input border-border">
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

        <div className="space-y-2">
          <Label>Barbero</Label>
          <Select value={salesStaffFilter} onValueChange={setSalesStaffFilter}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Barbero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-[400px] overflow-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="text-left py-3 px-4">Fecha</th>
              <th className="text-left py-3 px-4">Producto</th>
              <th className="text-right py-3 px-4">Cantidad</th>
              <th className="text-left py-3 px-4">Barbero</th>
            </tr>
          </thead>
          <tbody>
            {salesHistory.length > 0 ? (
              salesHistory.map((sale) => (
                <tr key={sale.id} className="border-t border-border/50">
                  <td className="py-3 px-4">
                    {new Date(sale.sold_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 px-4">{sale.product_name}</td>
                  <td className="py-3 px-4 text-right">{sale.quantity}</td>
                  <td className="py-3 px-4">{sale.staff_name || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No hay ventas para ese filtro
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setSalesHistoryOpen(false)}>
        Cerrar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  )
}
