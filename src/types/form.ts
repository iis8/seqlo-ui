import type { Component } from 'vue'
import type { FormItemRule } from 'element-plus'
import type { Field } from './field'

export interface FormField<Scope = any> extends Field<Scope> {
  colSpan?: number
  rules?: FormItemRule[]
  required?: boolean
  visible?: boolean
  defaultValue?: any
}

export interface FormGroup {
  title?: string
  icon?: string | Component
  fields: FormField[]
  gutter?: number
  collapsible?: boolean
  collapsed?: boolean
}

export interface FormConfig {
  groups?: FormGroup[]
  fields?: FormField[]
  labelWidth?: string
  gutter?: number
  customComponents?: Record<string, Component>
  rules?: Record<string, FormItemRule[]>
}