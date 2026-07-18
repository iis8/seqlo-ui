/**
 * 预置组件映射表，用于Table、Search等组件
 */
import type { Component } from 'vue'
import { ElInput, ElSelect, ElDatePicker, ElCascader, ElOption, ElRate } from 'element-plus'

export const PRESET_COMPONENTS: Record<string, Component> = {
  // 简化el plus组件映射表
  Input: ElInput,
  Select: ElSelect,
  DatePicker: ElDatePicker,
  Cascader: ElCascader,
  Option: ElOption,
  Rate: ElRate,
}

export function registerPresetComponents(components: Record<string, Component>) {
  Object.assign(PRESET_COMPONENTS, components)
}