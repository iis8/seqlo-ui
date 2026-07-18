import type { Component } from 'vue'
import { PRESET_COMPONENTS } from '../presetComponents'

export function resolveFieldComponent(
  comp?: string | Component,
  customComponents?: Record<string, Component>
): Component | string | undefined {
  if (!comp) return undefined
  if (typeof comp === 'string') {
    return customComponents?.[comp] || PRESET_COMPONENTS[comp] || comp
  }
  return comp
}

export function mergeComponentProps(
  baseProps: Record<string, any>,
  customProps?: Record<string, any> | ((context: any) => Record<string, any>),
  context?: any
): Record<string, any> {
  const custom = typeof customProps === 'function' ? customProps(context) : customProps
  return { ...baseProps, ...custom }
}

export function mergeComponentListeners(
  customListeners?: Record<string, Function> | ((context: any) => Record<string, Function>),
  context?: any
): Record<string, Function> {
  if (typeof customListeners === 'function') {
    return customListeners(context) || {}
  }
  return customListeners || {}
}