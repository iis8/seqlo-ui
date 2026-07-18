// 主样式（一次性导入，包含 .scroll-container / .table-container / 列选择器等所有公共样式）
import './style.scss'

// 组件
export { default as MTable } from './table/MTable.vue'
export { default as MDescriptions } from './MDescriptions.vue'
export { default as SearchBar } from './SearchBar.vue'
export { default as FieldRenderer } from './FieldRenderer.vue'
export { default as FieldEditor } from './FieldEditor.vue'
export { default as MForm } from './MForm.vue'

// 类型
export type { Field, FieldOption, EditableFieldConfig, FieldEditorScope } from './types/field'
export type { SearchField } from './types/search'
export type { Column, TableScope, TableCrudApi, BatchAction } from './types/table'
export type { PageResult, ApiResponse } from './types/api'
export type { FormField, FormGroup, FormConfig } from './types/form'
export type { DescriptionsField, DescriptionsApi, Rules } from './types/descriptions'

// 工具函数
export { resolveFieldComponent, mergeComponentProps, mergeComponentListeners } from './utils/resolveComponent'

// 预置组件
export { PRESET_COMPONENTS, registerPresetComponents } from './presetComponents'

// 依赖注入入口
export { createSeqlo, install } from './setup'
export type { SeqloOptions, VueI18nInstance, I18nAdapter, UseLocalStorageFn, StorageOptions } from './setup'

// i18n 翻译消息
export { seqloMessages, type SeqloI18nMessages } from './i18n'

import('./composables/useAutoInit').then(({ tryAutoInit }) => {
  tryAutoInit()
})
