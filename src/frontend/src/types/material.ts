export interface Material {
  id: string
  materialCode: string
  name: string
  specification?: string
  brand: string
  unit: string
  standardPrice: number
  category?: string
  isActive: boolean
  createdAt: string
}

export interface CreateMaterialDto {
  materialCode: string
  name: string
  specification?: string
  brand: string
  unit: string
  standardPrice: number
  category?: string
}

export interface UpdateMaterialDto {
  materialCode: string
  name: string
  specification?: string
  brand: string
  unit: string
  standardPrice: number
  category?: string
  isActive: boolean
}
