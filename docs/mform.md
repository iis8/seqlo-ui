# MForm 组件文档

## 概述

`MForm` 是表单组件，基于 Element Plus `el-form` 封装，提供以下核心功能：

- 自动渲染：根据字段配置自动渲染表单
- 分组支持：支持表单字段分组显示
- 验证支持：内置 Element Plus 表单验证
- 自定义组件：支持自定义渲染组件

## 基本用法

```vue
<template>
  <MForm
    :fields="formFields"
    :model="formModel"
    :rules="formRules"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MForm } from '@seqlo/ui'
import type { FormField, Rules } from '@seqlo/ui'

const formModel = ref({})

const formFields: FormField[] = [
  { prop: 'name', label: '姓名', required: true },
  { prop: 'email', label: '邮箱', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions },
]

const formRules: Rules = {
  name: [{ required: true, message: '请输入姓名' }],
  email: [{ type: 'email', message: '请输入正确的邮箱' }],
}

const handleSubmit = (data) => {
  console.log('表单数据:', data)
}
</script>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fields | `FormField[]` | - | 表单字段配置 |
| model | `Record<string, any>` | - | 表单模型 |
| rules | `Rules` | - | 验证规则 |
| groups | `FormGroup[]` | - | 表单分组配置 |
| labelWidth | `string` | `'120px'` | 标签宽度 |
| gutter | `number` | `20` | 栅格间距 |

## FormField 类型

```ts
interface FormField<Scope = any> extends Field<Scope> {
  colSpan?: number                    // 栅格列数（24格）
  rules?: FormItemRule[]              // 验证规则
  required?: boolean                  // 是否必填
  visible?: boolean                   // 是否显示
  defaultValue?: any                  // 默认值
}
```

### 常用字段说明

#### prop

字段名：

```ts
{ prop: 'name', label: '姓名' }
```

#### label

字段标签：

```ts
{ prop: 'name', label: '姓名' }
```

#### colSpan

栅格列数（默认 12，共 24 格）：

```ts
{ prop: 'name', label: '姓名', colSpan: 24 }
```

#### required

是否必填：

```ts
{ prop: 'name', label: '姓名', required: true }
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

#### visible

是否显示：

```ts
{ prop: 'password', label: '密码', visible: false }
```

#### defaultValue

默认值：

```ts
{ prop: 'status', label: '状态', defaultValue: 1 }
```

## FormGroup 类型

```ts
interface FormGroup {
  title?: string                    // 分组标题
  icon?: string | Component         // 分组图标
  fields: FormField[]               // 分组字段
  gutter?: number                   // 分组内间距
  collapsible?: boolean             // 是否可折叠
  collapsed?: boolean               // 是否默认折叠
}
```

## Events

| Event | 参数 | 说明 |
|-------|------|------|
| submit | `data: Record<string, any>` | 表单提交 |
| change | `{ prop: string, value: any }` | 字段值变化 |

## 高级用法

### 表单分组

```vue
<MForm
  :groups="[
    {
      title: '基本信息',
      fields: [
        { prop: 'name', label: '姓名', colSpan: 12 },
        { prop: 'email', label: '邮箱', colSpan: 12 },
      ],
    },
    {
      title: '其他信息',
      fields: [
        { prop: 'status', label: '状态', type: 'select', options: options },
        { prop: 'remark', label: '备注', type: 'textarea' },
      ],
      collapsible: true,
    },
  ]"
  :model="formModel"
  @submit="handleSubmit"
/>
```

### 自定义组件

```vue
<MForm
  :fields="[
    { prop: 'avatar', label: '头像', component: AvatarUploader },
    { prop: 'tags', label: '标签', component: TagInput },
  ]"
  :model="formModel"
  @submit="handleSubmit"
/>
```

### 动态显示

```vue
<MForm
  :fields="[
    { prop: 'type', label: '类型', type: 'select', options: options },
    { prop: 'detail', label: '详情', type: 'textarea', visible: formModel.type === 'custom' },
  ]"
  :model="formModel"
  @submit="handleSubmit"
/>
```
