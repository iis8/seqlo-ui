# MDescriptions 组件文档

## 概述

`MDescriptions` 是基于 Element Plus `el-descriptions` 的增强型详情组件，提供以下核心功能：

- 字段级别的编辑能力
- API 模式：支持按字段更新
- 自动渲染：根据字段配置自动渲染详情内容
- 自定义组件：支持自定义渲染组件

## 基本用法

```vue
<template>
  <MDescriptions
    :fields="fields"
    :data="detailData"
    :api="descriptionsApi"
    :model-id="id"
    border
  />
</template>

<script setup lang="ts">
import { MDescriptions } from '@seqlo/ui'
import type { DescriptionsField, DescriptionsApi } from '@seqlo/ui'

const fields: DescriptionsField[] = [
  { prop: 'name', label: '姓名' },
  { prop: 'email', label: '邮箱', editable: true },
  { prop: 'status', label: '状态', component: 'DictTag', options: statusOptions },
  { prop: 'createTime', label: '创建时间', formatter: (val) => formatDate(val) },
]

const descriptionsApi: DescriptionsApi = {
  updateByField: (id, fieldName, value) => api.patch(`/users/${id}`, { [fieldName]: value }),
}
</script>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fields | `DescriptionsField[]` | - | 字段配置，必填 |
| data | `any` | - | 详情数据 |
| api | `DescriptionsApi` | - | API 配置（支持 updateByField） |
| modelId | `number \| string` | - | 当前数据 ID（用于更新） |
| border | `boolean` | `false` | 是否显示边框 |
| column | `number` | `3` | 列数 |
| size | `'' \| 'default' \| 'small'` | `''` | 尺寸 |

## DescriptionsField 类型

```ts
interface DescriptionsField extends EditableFieldConfig {
  prop: string                          // 字段名
  label?: string                        // 字段标签
  span?: number                         // 占用列数
  width?: string | number               // 宽度
  minWidth?: string | number            // 最小宽度
  align?: 'left' | 'center' | 'right'   // 内容对齐方式
  labelAlign?: 'left' | 'center' | 'right' // 标签对齐方式
  editable?: boolean                    // 是否可编辑
  slot?: boolean | string               // 自定义 slot 名称
}
```

### 常用字段说明

#### prop

字段名，用于从 data 中获取值。

```ts
{ prop: 'name', label: '姓名' }
```

#### label

字段标签。

```ts
{ prop: 'name', label: '姓名' }
```

#### span

占用列数：

```ts
{ prop: 'description', label: '描述', span: 2 }
```

#### align / labelAlign

对齐方式：

```ts
{ prop: 'id', label: 'ID', align: 'center', labelAlign: 'center' }
```

#### editable

是否可编辑：

```ts
{ prop: 'email', label: '邮箱', editable: true }
```

#### component

自定义渲染组件：

```ts
{ prop: 'status', label: '状态', component: 'DictTag' }
```

#### formatter

值格式化函数：

```ts
{ prop: 'createTime', label: '创建时间', formatter: (val) => formatDate(val) }
```

#### options

选项列表：

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

## DescriptionsApi 类型

```ts
interface DescriptionsApi {
  updateByField?: (id: string, fieldName: string, value: any) => Promise<ApiResponse<any>>
}
```

### updateByField

按字段更新，用于内联编辑：

```ts
updateByField: (id, fieldName, value) => api.patch(`/users/${id}`, { [fieldName]: value })
```

## Slots

| Slot | 说明 |
|------|------|
| `{prop}` | 自定义字段渲染（prop 为字段的 prop 值） |

### Slot 示例

```vue
<MDescriptions :fields="fields" :data="data">
  <template #status="{ value }">
    <el-tag :type="value === 1 ? 'success' : 'danger'">
      {{ value === 1 ? '启用' : '禁用' }}
    </el-tag>
  </template>
</MDescriptions>
```

## 高级用法

### 可编辑详情

```vue
<MDescriptions
  :fields="[
    { prop: 'name', label: '姓名', editable: true },
    { prop: 'email', label: '邮箱', editable: true },
    { prop: 'status', label: '状态', component: 'DictTag', editComponent: 'DictSelect', editable: true },
  ]"
  :data="data"
  :api="{
    updateByField: (id, fieldName, value) => api.patch(`/users/${id}`, { [fieldName]: value }),
  }"
  :model-id="id"
  border
/>
```

### 自定义组件

```vue
<MDescriptions
  :fields="[
    { prop: 'avatar', label: '头像', component: AvatarComponent },
    { prop: 'tags', label: '标签', component: TagListComponent },
  ]"
  :data="data"
/>
```
