import type { EditableFieldConfig } from './field'
import type { ApiResponse } from './api'
import type { FormItemRule } from 'element-plus'

export type Rules = Record<string, FormItemRule[]>

export interface DescriptionsField extends EditableFieldConfig {
  prop: string
  label?: string
  span?: number
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  labelAlign?: 'left' | 'center' | 'right'
  editable?: boolean
  slot?: boolean | string
}

export interface DescriptionsApi {
  updateByField?: (id: string, fieldName: string, value: any) => Promise<ApiResponse<any>>
}