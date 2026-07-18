# MTable 组件文档

## 概述

`MTable` 是基于 Element Plus `el-table` 的增强型表格组件，提供以下核心功能：

- API 模式：自动处理分页、搜索、排序
- 内联编辑：支持单元格级别的编辑
- 批量操作：批量编辑、批量删除
- 搜索栏：支持简单搜索和高级搜索模式
- 列配置：支持列显示/隐藏切换和拖拽排序
- 状态持久化：列配置自动保存到 localStorage

## 基本用法

```vue
<template>
  <MTable
    :columns="columns"
    :crud-api="crudApi"
    :search-bar="searchFields"
    :batch-actions="batchActions"
  />
</template>

<script setup lang="ts">
import { MTable } from '@seqlo/ui'
import type { Column, TableCrudApi, BatchAction, SearchField } from '@seqlo/ui'

const columns: Column[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '姓名', editable: true },
  { prop: 'email', label: '邮箱', editable: true },
  { prop: 'status', label: '状态', component: 'DictSelect', options: statusOptions },
]

const crudApi: TableCrudApi = {
  search: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (data) => api.put(`/users/${data.id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

const searchFields: SearchField[] = [
  { prop: 'keyword', label: '关键词', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions },
]

const batchActions: BatchAction[] = [
  {
    label: '导出选中',
    action: (rows) => exportService.export(rows),
    disabled: (rows) => rows.length === 0,
  },
]
</script>
```

## Props

### 基础配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| columns | `Column[]` | - | 列配置，必填 |
| data | `any[]` | - | 静态数据（非 API 模式） |
| crudApi | `TableCrudApi` | - | CRUD API 配置（API 模式） |
| rowKey | `string` | `'id'` | 行唯一标识字段 |
| size | `'' \| 'default' \| 'small' \| 'large'` | `''` | 表格尺寸 |
| componentId | `string` | `'default'` | 组件唯一标识（用于 localStorage） |

### 分页配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| pagination | `boolean` | `true` | 是否显示分页 |
| defaultPageSize | `number` | `20` | 默认每页条数 |
| pageSizes | `number[]` | `[10, 20, 50, 100]` | 可选每页条数 |

### 搜索配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| searchBar | `boolean \| SearchField[]` | `false` | 是否显示搜索栏或搜索字段配置 |
| defaultQueryParams | `Record<string, any>` | `{}` | 默认查询参数 |

### 操作配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| editable | `boolean` | `true` | 是否可编辑（控制新增/编辑/删除按钮显示） |
| addButton | `boolean` | `true` | 是否显示新增按钮 |
| batchActions | `BatchAction[]` | - | 自定义批量操作 |
| rowActions | `RowAction[]` | - | 自定义行操作 |

### 表单配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| rules | `Rules` | - | 表单验证规则 |
| syncDetailOnEdit | `boolean` | `false` | 编辑时同步详情数据 |
| customComponents | `Record<string, Component>` | - | 自定义组件映射 |

## Column 类型

```ts
interface Column<T = any> extends EditableFieldConfig<TableScope<T>> {
  label: string                          // 表头标签
  width?: number | string               // 列宽
  minWidth?: number | string            // 最小宽度
  align?: 'left' | 'center' | 'right'   // 对齐方式
  fixed?: true | 'left' | 'right'       // 固定列
  sortable?: boolean                    // 是否可排序
  showOverflowTooltip?: boolean         // 内容溢出时显示 tooltip
  columnAttrs?: Record<string, any>     // 列属性透传
  slot?: boolean | string               // 自定义 slot 名称
  headerComponent?: string | Component  // 表头自定义组件
  headerComponentProps?: Record<string, any> | ((column) => Record<string, any>)
  headerSlot?: string                   // 表头 slot 名称
  
  // 编辑相关
  editable?: boolean                    // 是否可编辑
  batchEdit?: boolean                   // 是否允许批量编辑
}
```

### 常用字段说明

#### prop

字段名，用于从行数据中获取值。

```ts
{ prop: 'name', label: '姓名' }
```

#### label

表头显示文本。支持字符串或函数：

```ts
{ prop: 'name', label: '姓名' }
{ prop: 'name', label: () => t('common.name') }
```

#### width / minWidth

列宽度配置：

```ts
{ prop: 'id', label: 'ID', width: 80 }
{ prop: 'name', label: '姓名', minWidth: 120 }
```

#### align

列对齐方式：

```ts
{ prop: 'id', label: 'ID', align: 'center' }
```

#### sortable

是否支持排序（API 模式下自动处理排序参数）：

```ts
{ prop: 'createTime', label: '创建时间', sortable: true }
```

#### editable

是否可内联编辑：

```ts
{ prop: 'email', label: '邮箱', editable: true }
```

#### component

自定义渲染组件，支持字符串或 Vue 组件：

```ts
{ prop: 'status', label: '状态', component: 'DictSelect' }
{ prop: 'status', label: '状态', component: StatusTag }
```

#### editComponent

编辑模式下使用的组件：

```ts
{ prop: 'status', label: '状态', editable: true, component: 'DictTag', editComponent: 'DictSelect' }
```

#### formatter

单元格值格式化函数：

```ts
{ 
  prop: 'createTime', 
  label: '创建时间',
  formatter: (value) => formatDate(value)
}
```

#### options

选项列表（用于 select 类型组件）：

```ts
{ 
  prop: 'status', 
  label: '状态',
  options: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]
}
```

#### rules

验证规则：

```ts
{ 
  prop: 'email', 
  label: '邮箱',
  editable: true,
  rules: [{ type: 'email', message: '请输入正确的邮箱地址' }]
}
```

## TableCrudApi 类型

```ts
interface TableCrudApi<T = any> {
  search: (params: any) => Promise<PageResult<T>>
  create?: (value: T) => Promise<ApiResponse<T>>
  update?: (value: T) => Promise<ApiResponse<any>>
  updateByField?: (id: string, fieldName: string, value: any) => Promise<ApiResponse<any>>
  batchUpdateField?: (ids: string[], fieldName: string, value: any) => Promise<ApiResponse<any>>
  getById?: (id: string) => Promise<ApiResponse<T>>
  delete?: (id: string) => Promise<ApiResponse<any>>
  batchDelete?: (ids: string[]) => Promise<ApiResponse<any>>
}
```

### 接口说明

#### search

获取列表数据，返回分页结果：

```ts
search: (params) => api.get('/users', { params })
```

#### create

创建新数据：

```ts
create: (data) => api.post('/users', data)
```

#### update

更新数据：

```ts
update: (data) => api.put(`/users/${data.id}`, data)
```

#### updateByField

按字段更新（用于内联编辑）：

```ts
updateByField: (id, fieldName, value) => api.patch(`/users/${id}`, { [fieldName]: value })
```

#### delete

删除单条数据：

```ts
delete: (id) => api.delete(`/users/${id}`)
```

#### batchDelete

批量删除：

```ts
batchDelete: (ids) => api.delete('/users/batch', { data: { ids } })
```

## BatchAction 类型

```ts
interface BatchAction<T = any> {
  label: string
  action: (selectedRows: T[]) => void | Promise<void>
  disabled?: (selectedRows: T[]) => boolean
  divided?: boolean
  icon?: string | Component
}
```

### 示例

```ts
const batchActions: BatchAction[] = [
  {
    label: '批量导出',
    action: async (rows) => {
      await exportService.export(rows)
    },
    disabled: (rows) => rows.length === 0,
    icon: 'Download',
  },
  {
    label: '批量审核',
    action: (rows) => {
      rows.forEach(row => {
        api.post(`/audit/${row.id}`)
      })
    },
    divided: true,
  },
]
```

## Events

| Event | 参数 | 说明 |
|-------|------|------|
| load-success | `data: any[]` | 数据加载成功 |
| load-error | `error: any` | 数据加载失败 |
| add-click | - | 点击新增按钮 |
| search-click | `query: Record<string, any>` | 点击搜索按钮 |
| reset-click | - | 点击重置按钮 |
| selection-change | `selection: any[]` | 选中行变化 |
| update:size | `value: string` | 表格尺寸变化 |
| update:page-size | `value: number` | 每页条数变化 |
| update:current-page | `value: number` | 当前页码变化 |

## Slots

| Slot | 说明 |
|------|------|
| left-actions | 左侧操作区前置内容 |
| left-actions-right | 左侧操作区后置内容（新增按钮之后） |
| right-actions | 右侧操作区前置内容 |
| header | 表格头部区域 |
| footer | 表格底部区域 |
| `{prop}` | 自定义列渲染（prop 为列的 prop 值） |
| `{prop}-edit` | 自定义列编辑渲染 |

### Slot 示例

```vue
<MTable :columns="columns" :crud-api="crudApi">
  <template #left-actions>
    <el-button @click="handleExport">导出全部</el-button>
  </template>
  
  <template #name="{ row }">
    <el-tag>{{ row.name }}</el-tag>
  </template>
  
  <template #name-edit="{ row }">
    <el-input v-model="row.name" />
  </template>
</MTable>
```

## 高级用法

### API 模式

```vue
<MTable
  :columns="columns"
  :crud-api="{
    search: (params) => api.get('/users', { params }),
    create: (data) => api.post('/users', data),
    update: (data) => api.put(`/users/${data.id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
  }"
/>
```

### 静态数据模式

```vue
<MTable
  :columns="columns"
  :data="tableData"
  :pagination="false"
/>
```

### 内联编辑

```vue
<MTable
  :columns="[
    { prop: 'name', label: '姓名', editable: true },
    { prop: 'email', label: '邮箱', editable: true },
    { prop: 'status', label: '状态', editable: true, component: 'DictTag', editComponent: 'DictSelect' },
  ]"
  :crud-api="crudApi"
/>
```

### 批量操作

```vue
<MTable
  :columns="columns"
  :crud-api="crudApi"
  :batch-actions="[
    {
      label: '导出选中',
      action: (rows) => exportService.export(rows),
    },
  ]"
/>
```

### 自定义搜索

```vue
<MTable
  :columns="columns"
  :crud-api="crudApi"
  :search-bar="[
    { prop: 'keyword', label: '关键词', type: 'input' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
    { prop: 'dateRange', label: '日期范围', type: 'date', transform: (val) => ({ startDate: val[0], endDate: val[1] }) },
  ]"
/>
```

### 列配置持久化

通过 `componentId` 实现同一页面不同实例的配置独立保存：

```vue
<MTable
  :columns="columns"
  :crud-api="crudApi"
  component-id="user-list"
/>
```

### 表单验证

```vue
<MTable
  :columns="columns"
  :crud-api="crudApi"
  :rules="{
    name: [{ required: true, message: '请输入姓名' }],
    email: [{ type: 'email', message: '请输入正确的邮箱' }],
  }"
/>
```
