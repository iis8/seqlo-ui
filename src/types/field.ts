import type { Component, VNode } from 'vue'
import type { FormItemRule } from 'element-plus'

export interface Field<Scope = any> {
  prop: string
  label?: string
  placeholder?: string
  component?: string | Component
  componentProps?: Record<string, any> | ((scope: Scope) => Record<string, any>)
  componentListeners?: Record<string, Function> | ((scope: Scope) => Record<string, Function>)
  /** 选项字段选项值 */
  options?: FieldOption[]
  /** 加载选项字段选项值的方法 */
  loadOptions?: () => Promise<FieldOption[]>
  /** 是否禁用此字段 */
  disabled?: boolean
}

export interface FieldEditorScope {
  value: any
}

/**
 * 可编辑字段配置
 */
export interface EditableFieldConfig<Scope = FieldEditorScope> extends Field<Scope>{
  prop: string
  editComponent?: string | Component
  editComponentProps?: Record<string, any> | ((scope: Scope) => Record<string, any>)
  editComponentListeners?: Record<string, Function> | ((scope: Scope) => Record<string, Function>)
  formatter?: ((value: any) => any) | ((row: any, column: any, cellValue: any, index: number) => any)
  render?: (scope: Scope) => VNode
  updateOnChange?: boolean
  rules?: FormItemRule[]
  /** 
   * 内联编辑，显示与编辑组件相同。
   * editable属性为false时disabled设置为true禁止编辑
   * updateOnChange设置为true才能同步触发change
   */
  inlineEdit?: boolean
}

/**
 * 选项字段选项值
 */
export interface FieldOption {
  label: string
  value: any
}