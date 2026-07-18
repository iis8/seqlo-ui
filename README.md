# @seqlo/ui

基于 Vue 3 + Element Plus 的业务组件库，提供表格、表单、详情页等常用组件的二次封装，支持 API 模式、内联编辑、批量操作等功能。

## 特性

- 📦 **开箱即用**：零配置自动检测 vue-i18n，无需手动合并翻译消息
- 📱 **多端兼容**：支持 Element Plus 所有尺寸（large/default/small）
- ✏️ **内联编辑**：表格支持单元格级别的内联编辑
- 📊 **批量操作**：支持批量编辑、批量删除等批量操作
- 🔍 **智能搜索**：支持简单搜索和高级搜索模式
- 🎨 **自定义渲染**：支持自定义组件和 slot 渲染
- 💾 **状态持久化**：表格列配置、搜索条件自动持久化到 localStorage

## 安装

```bash
# 使用 npm
npm install @seqlo/ui

# 使用 yarn
yarn add @seqlo/ui

# 使用 pnpm
pnpm add @seqlo/ui
```

## 快速开始

### 基础用法（零配置）

组件库会自动检测宿主的 vue-i18n 并注入翻译消息，无需手动配置：

```vue
<template>
  <MTable
    :columns="columns"
    :data="data"
    :crud-api="crudApi"
  />
</template>

<script setup lang="ts">
import { MTable } from '@seqlo/ui'
import type { Column, TableCrudApi } from '@seqlo/ui'

const columns: Column[] = [
  { prop: 'name', label: '姓名' },
  { prop: 'age', label: '年龄' },
  { prop: 'email', label: '邮箱', editable: true },
]

const crudApi: TableCrudApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}
</script>
```

### 完整配置（推荐）

如需自定义 localStorage 或预注册业务组件，使用 `install` 函数：

```ts
// main.ts
import { createApp } from 'vue'
import { install } from '@seqlo/ui'
import i18n from '@/i18n'
import { useAppLocalStorage } from '@/utils/storage'

const app = createApp(App)

install(app, {
  i18n,
  useLocalStorage: useAppLocalStorage,
})

app.mount('#app')
```

## 组件

### MTable

增强型表格组件，支持 API 模式、内联编辑、批量操作等。

```vue
<MTable
  :columns="columns"
  :data="data"
  :crud-api="crudApi"
  :pagination="true"
  :search-bar="true"
  :batch-actions="batchActions"
  :row-actions="rowActions"
  size="small"
/>
```

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| columns | `Column[]` | - | 列配置 |
| data | `any[]` | - | 静态数据（非 API 模式） |
| crudApi | `TableCrudApi` | - | CRUD API 配置（API 模式） |
| pagination | `boolean` | `true` | 是否显示分页 |
| searchBar | `boolean \| SearchField[]` | `false` | 是否显示搜索栏 |
| batchActions | `BatchAction[]` | - | 批量操作配置 |
| rowActions | `RowAction[]` | - | 行操作配置 |
| size | `'' \| 'default' \| 'small' \| 'large'` | `''` | 表格尺寸 |
| rowKey | `string` | `'id'` | 行唯一标识字段 |
| defaultPageSize | `number` | `20` | 默认每页条数 |
| componentId | `string` | `'default'` | 组件唯一标识（用于 localStorage） |
| rules | `Rules` | - | 验证规则 |
| syncDetailOnEdit | `boolean` | `false` | 编辑时同步详情数据 |

### MDescriptions

增强型详情组件，支持 API 模式和自动更新。

```vue
<MDescriptions
  :fields="fields"
  :data="data"
  :api="api"
  :model-id="id"
  border
/>
```

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fields | `DescriptionsField[]` | - | 字段配置 |
| data | `any` | - | 静态数据 |
| api | `DescriptionsApi` | - | API 配置（支持 updateByField） |
| modelId | `number \| string` | - | 当前数据 ID |
| border | `boolean` | `false` | 是否显示边框 |
| column | `number` | `3` | 列数 |

### SearchBar

搜索栏组件，支持简单搜索和高级搜索模式。

```vue
<SearchBar
  :fields="searchFields"
  :model="searchModel"
  @search="handleSearch"
  @reset="handleReset"
/>
```

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fields | `SearchField[]` | - | 搜索字段配置 |
| model | `Record<string, any>` | - | 搜索模型 |
| simple | `boolean` | `true` | 是否显示为简单模式 |
| searchOnChange | `boolean` | `false` | 是否在字段变化时触发搜索 |

### FieldEditor

字段编辑器，支持内联编辑和弹窗编辑。

```vue
<FieldEditor
  :field="field"
  :value="value"
  :model="rowData"
  @change="handleChange"
/>
```

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| field | `Field` | - | 字段配置 |
| value | `any` | - | 当前值 |
| model | `any` | - | 所在行数据 |
| inlineEdit | `boolean` | `false` | 是否内联编辑模式 |

### FieldRenderer

字段渲染器，用于渲染只读字段。

```vue
<FieldRenderer
  :field="field"
  :value="value"
  :model="rowData"
/>
```

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| field | `Field` | - | 字段配置 |
| value | `any` | - | 当前值 |
| model | `any` | - | 所在行数据 |

### MForm

表单组件，支持分组和自动校验。

```vue
<MForm
  :fields="formFields"
  :model="formModel"
  :rules="rules"
  :groups="formGroups"
  @submit="handleSubmit"
/>
```

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fields | `FormField[]` | - | 表单字段配置 |
| model | `Record<string, any>` | - | 表单模型 |
| rules | `Rules` | - | 验证规则 |
| groups | `FormGroup[]` | - | 表单分组配置 |
| labelWidth | `string` | `'120px'` | 标签宽度 |

## 类型定义

### Column

表格列配置：

```ts
interface Column {
  prop: string                          // 字段名
  label: string                         // 表头标签
  width?: string | number               // 列宽
  minWidth?: string | number            // 最小宽度
  align?: 'left' | 'center' | 'right'   // 对齐方式
  editable?: boolean                    // 是否可编辑
  component?: string | Component        // 自定义组件
  editComponent?: string | Component    // 编辑模式组件
  formatter?: (value: any, row: any) => string  // 格式化函数
  searchable?: boolean                  // 是否可搜索
  hideInTable?: boolean                 // 是否在表格中隐藏
  hideInForm?: boolean                  // 是否在表单中隐藏
  hideInDetail?: boolean                // 是否在详情中隐藏
  options?: FieldOption[]               // 选项列表（select 类型）
  rules?: RuleItem[]                    // 验证规则
  slot?: string                         // 自定义 slot 名称
  editSlot?: string                     // 编辑模式 slot 名称
}
```

### Field

字段配置：

```ts
interface Field {
  prop: string                          // 字段名
  label: string                         // 字段标签
  type?: string                         // 字段类型（input/select/date/password等）
  component?: string | Component        // 自定义组件
  options?: FieldOption[]               // 选项列表
  placeholder?: string                  // 占位符
  readonly?: boolean                    // 是否只读
  disabled?: boolean                    // 是否禁用
  rules?: RuleItem[]                    // 验证规则
  props?: Record<string, any>           // 组件 props
  listeners?: Record<string, any>       // 组件事件监听
}
```

### SearchField

搜索字段配置：

```ts
interface SearchField {
  prop: string                          // 字段名
  label: string                         // 字段标签
  type?: string                         // 字段类型
  options?: FieldOption[]               // 选项列表
  placeholder?: string                  // 占位符
  hideInSimple?: boolean                // 是否在简单模式中隐藏
  searchOnChange?: boolean              // 是否在变化时触发搜索
}
```

### TableCrudApi

CRUD API 配置：

```ts
interface TableCrudApi {
  list: (params: Record<string, any>) => Promise<ApiResponse>  // 列表接口
  create?: (data: Record<string, any>) => Promise<any>         // 新增接口
  update?: (id: number | string, data: Record<string, any>) => Promise<any>  // 更新接口
  delete?: (id: number | string) => Promise<any>               // 删除接口
}
```

## 国际化 (i18n)

### 自动检测

组件库会自动检测宿主的 vue-i18n 实例并注入翻译消息，无需手动配置。

### 覆盖翻译

如需自定义翻译内容，在宿主的语言文件中添加 `mtable` 命名空间：

```ts
// zh.ts
export default {
  mtable: {
    add: '新建数据',                    // 覆盖默认的"新增"
    delete: '删除记录',                 // 覆盖默认的"删除"
    batchOperation: '批量操作 ({count})',  // 覆盖默认翻译
  },
}
```

### 翻译 Key 列表

```ts
mtable: {
  batchOperation: '批量操作 ({count})',
  batchEdit: '批量编辑',
  batchEditField: '编辑字段',
  batchEditFieldPlaceholder: '请选择编辑字段',
  batchEditValue: '编辑值',
  batchDelete: '批量删除',
  add: '新增',
  columnSelect: '显示列选择',
  all: '全部',
  reset: '重置',
  tableSize: '表格大小',
  sizeLarge: '大',
  sizeDefault: '默认',
  sizeSmall: '小',
  action: '操作',
  view: '查看',
  edit: '编辑',
  delete: '删除',
  confirmDelete: '确定要删除这条记录吗？',
  confirmBatchDelete: '确定要删除选中的 {count} 条记录吗？',
  refreshHint: '数据已超过 {minutes} 分钟未刷新',
  refresh: '刷新',
  dataUpdated: '数据已被其他用户更新，请确认内容',
  syncing: '正在同步最新数据...',
  validation: {
    required: '字段 {field} 必填',
    stringMin: '{field} 长度不能小于 {min}',
    stringMax: '{field} 长度不能大于 {max}',
    numberMin: '{field} 不能小于 {min}',
    numberMax: '{field} 不能大于 {max}',
    pattern: '{field} 格式不正确',
    validator: '{field} 验证失败',
  },
}
```

## 高级配置

### createSeqlo

手动配置组件库：

```ts
import { createSeqlo } from '@seqlo/ui'

createSeqlo({
  i18n: vueI18nInstance,                    // vue-i18n 实例
  useLocalStorage: useAppLocalStorage,       // 自定义 localStorage Hook
})
```

### install

Vue 插件方式配置（推荐）：

```ts
import { install } from '@seqlo/ui'

app.use(install, {
  i18n: vueI18nInstance,
  useLocalStorage: useAppLocalStorage,
})
```

### registerPresetComponents

注册预定义组件，使其可在 FieldEditor/SearchBar 中通过字符串引用：

```ts
import { registerPresetComponents } from '@seqlo/ui'

registerPresetComponents({
  DictTag,
  DictSelect,
  UserLabel,
  UserSelect,
})
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

## 许可证

MIT
