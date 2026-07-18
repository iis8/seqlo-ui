# FieldEditor & FieldRenderer 组件文档

## 概述

### FieldEditor

`FieldEditor` 是字段编辑器组件，支持内联编辑和弹窗编辑两种模式，提供以下核心功能：

- 多种编辑组件：input、select、date、textarea 等
- 自定义组件：支持通过字符串或 Vue 组件指定
- 验证支持：内置 Element Plus 表单验证
- 事件通知：编辑完成后触发 change 事件

### FieldRenderer

`FieldRenderer` 是字段渲染器组件，用于只读场景的字段渲染，提供以下核心功能：

- 自动渲染：根据字段类型自动选择渲染方式
- 格式化支持：支持自定义格式化函数
- 自定义组件：支持通过字符串或 Vue 组件指定

## FieldEditor 基本用法

```vue
<template>
  <FieldEditor
    :field="field"
    :value="value"
    :model="rowData"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { FieldEditor } from '@seqlo/ui'
import type { EditableFieldConfig } from '@seqlo/ui'

const field: EditableFieldConfig = {
  prop: 'name',
  label: '姓名',
  type: 'input',
  rules: [{ required: true, message: '请输入姓名' }],
}

const handleChange = (value) => {
  console.log('新值:', value)
}
</script>
```

## FieldRenderer 基本用法

```vue
<template>
  <FieldRenderer
    :field="field"
    :value="value"
    :model="rowData"
  />
</template>

<script setup lang="ts">
import { FieldRenderer } from '@seqlo/ui'
import type { Field } from '@seqlo/ui'

const field: Field = {
  prop: 'status',
  label: '状态',
  component: 'DictTag',
  options: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ],
}
</script>
```

## FieldEditor Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| field | `EditableFieldConfig` | - | 字段配置，必填 |
| value | `any` | - | 当前值 |
| model | `any` | - | 所在行数据 |
| inlineEdit | `boolean` | `false` | 是否内联编辑模式 |

## FieldRenderer Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| field | `Field` | - | 字段配置，必填 |
| value | `any` | - | 当前值 |
| model | `any` | - | 所在行数据 |

## Field 类型

```ts
interface Field<Scope = any> {
  prop: string                                    // 字段名
  label?: string                                  // 字段标签
  placeholder?: string                            // 占位符
  component?: string | Component                  // 自定义组件
  componentProps?: Record<string, any> | ((scope: Scope) => Record<string, any>)  // 组件 props
  componentListeners?: Record<string, Function> | ((scope: Scope) => Record<string, Function>)  // 组件事件监听
  options?: FieldOption[]                         // 选项列表
  loadOptions?: () => Promise<FieldOption[]>      // 异步加载选项
  disabled?: boolean                              // 是否禁用
}
```

## EditableFieldConfig 类型

```ts
interface EditableFieldConfig<Scope = FieldEditorScope> extends Field<Scope> {
  editComponent?: string | Component              // 编辑模式组件
  editComponentProps?: Record<string, any> | ((scope: Scope) => Record<string, any>)  // 编辑组件 props
  editComponentListeners?: Record<string, Function> | ((scope: Scope) => Record<string, Function>)  // 编辑组件事件监听
  formatter?: ((value: any) => any) | ((row: any, column: any, cellValue: any, index: number) => any)  // 格式化函数
  render?: (scope: Scope) => VNode                // 自定义渲染函数
  updateOnChange?: boolean                        // 值变化时是否立即触发更新
  rules?: FormItemRule[]                          // 验证规则
  inlineEdit?: boolean                            // 内联编辑模式
}
```

### 常用字段说明

#### component

渲染组件，支持字符串或 Vue 组件：

```ts
{ prop: 'status', label: '状态', component: 'DictTag' }
{ prop: 'avatar', label: '头像', component: AvatarComponent }
```

#### editComponent

编辑模式下使用的组件：

```ts
{ 
  prop: 'status', 
  label: '状态', 
  component: 'DictTag',
  editComponent: 'DictSelect',
  editable: true,
}
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

#### loadOptions

异步加载选项：

```ts
{ 
  prop: 'category', 
  label: '分类',
  loadOptions: () => api.get('/categories').then(res => res.data),
}
```

#### formatter

值格式化函数：

```ts
{ prop: 'createTime', label: '创建时间', formatter: (val) => formatDate(val) }
```

#### rules

验证规则：

```ts
{ 
  prop: 'email', 
  label: '邮箱',
  rules: [{ type: 'email', message: '请输入正确的邮箱地址' }],
}
```

#### updateOnChange

值变化时是否立即触发更新：

```ts
{ prop: 'status', label: '状态', updateOnChange: true }
```

#### inlineEdit

内联编辑模式（显示与编辑组件相同）：

```ts
{ prop: 'name', label: '姓名', inlineEdit: true }
```

## FieldOption 类型

```ts
interface FieldOption {
  label: string
  value: any
}
```

## FieldEditor Events

| Event | 参数 | 说明 |
|-------|------|------|
| change | `value: any` | 编辑完成，值发生变化 |

## 高级用法

### 自定义组件

```vue
<FieldEditor
  :field="{
    prop: 'tags',
    label: '标签',
    component: TagList,
    editComponent: TagInput,
  }"
  :value="tags"
  @change="handleChange"
/>
```

### 动态组件 Props

```vue
<FieldEditor
  :field="{
    prop: 'status',
    label: '状态',
    component: 'DictSelect',
    componentProps: (scope) => ({
      disabled: scope.row.status === 1,
    }),
  }"
  :value="status"
  :model="row"
/>
```

### 异步选项

```vue
<FieldEditor
  :field="{
    prop: 'department',
    label: '部门',
    type: 'select',
    loadOptions: async () => {
      const res = await api.get('/departments')
      return res.data
    },
  }"
  :value="department"
  @change="handleChange"
/>
```

### 内联编辑

```vue
<FieldEditor
  :field="{
    prop: 'name',
    label: '姓名',
    inlineEdit: true,
    updateOnChange: true,
  }"
  :value="name"
  :model="row"
  @change="handleChange"
/>
```

### 格式化渲染

```vue
<FieldRenderer
  :field="{
    prop: 'createTime',
    label: '创建时间',
    formatter: (val) => new Date(val).toLocaleString('zh-CN'),
  }"
  :value="createTime"
/>
```
