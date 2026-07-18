# SearchBar 组件文档

## 概述

`SearchBar` 是搜索栏组件，支持简单搜索和高级搜索两种模式，提供以下核心功能：

- 简单搜索：单行紧凑布局
- 高级搜索：右侧抽屉展开，支持多列布局
- 自动搜索：值变化时可自动触发搜索
- 值转换：支持日期范围等复合控件的值转换

## 基本用法

```vue
<template>
  <SearchBar
    :fields="searchFields"
    :model-value="searchModel"
    @search="handleSearch"
    @reset="handleReset"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SearchBar } from '@seqlo/ui'
import type { SearchField } from '@seqlo/ui'

const searchModel = ref({})

const searchFields: SearchField[] = [
  { prop: 'keyword', label: '关键词', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions },
  { prop: 'dateRange', label: '日期范围', type: 'date', transform: (val) => ({ startDate: val[0], endDate: val[1] }) },
]

const handleSearch = (query) => {
  console.log('搜索参数:', query)
}

const handleReset = () => {
  searchModel.value = {}
}
</script>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fields | `SearchField[]` | - | 搜索字段配置，必填 |
| modelValue | `Record<string, any>` | `{}` | 搜索模型 |
| customComponents | `Record<string, Component>` | - | 自定义组件映射 |

## SearchField 类型

```ts
interface SearchField extends Field {
  hideInSimple?: boolean              // 是否在简单模式下隐藏
  searchOnChange?: boolean            // 值变化时是否自动触发搜索
  defaultValue?: any                  // 默认值
  transform?: (value: any) => Record<string, any>  // 值转换函数
  colSpan?: number                    // 高级搜索模式下的栅格列数（24格）
}
```

### 常用字段说明

#### prop

字段名：

```ts
{ prop: 'keyword', label: '关键词' }
```

#### label

字段标签：

```ts
{ prop: 'keyword', label: '关键词' }
```

#### type

字段类型，支持以下类型：

- `input`：输入框
- `select`：下拉选择
- `date`：日期选择器
- `dateRange`：日期范围选择器
- `number`：数字输入框
- `textarea`：文本域

```ts
{ prop: 'status', label: '状态', type: 'select' }
```

#### options

选项列表（用于 select 类型）：

```ts
{ 
  prop: 'status', 
  label: '状态',
  type: 'select',
  options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]
}
```

#### hideInSimple

是否在简单模式下隐藏（仅在高级搜索中显示）：

```ts
{ prop: 'createTime', label: '创建时间', type: 'date', hideInSimple: true }
```

#### searchOnChange

值变化时是否自动触发搜索：

```ts
{ prop: 'status', label: '状态', type: 'select', searchOnChange: true }
```

#### transform

值转换函数，用于日期范围等复合控件：

```ts
{ 
  prop: 'dateRange', 
  label: '日期范围', 
  type: 'date',
  transform: (val) => ({ startDate: val[0], endDate: val[1] })
}
```

#### colSpan

高级搜索模式下的栅格列数（默认 12，共 24 格）：

```ts
{ prop: 'keyword', label: '关键词', type: 'input', colSpan: 24 }
```

## Events

| Event | 参数 | 说明 |
|-------|------|------|
| search | `query: Record<string, any>` | 搜索按钮点击 |
| reset | - | 重置按钮点击 |
| mode-change | `mode: 'simple' \| 'advanced'` | 搜索模式切换 |

## 高级用法

### 日期范围搜索

```vue
<SearchBar
  :fields="[
    { 
      prop: 'dateRange', 
      label: '日期范围', 
      type: 'date',
      transform: (val) => ({ 
        startDate: val[0]?.format('YYYY-MM-DD'), 
        endDate: val[1]?.format('YYYY-MM-DD') 
      }),
    },
  ]"
  @search="handleSearch"
/>
```

### 自动搜索

```vue
<SearchBar
  :fields="[
    { prop: 'status', label: '状态', type: 'select', options: options, searchOnChange: true },
  ]"
  @search="handleSearch"
/>
```

### 高级搜索

```vue
<SearchBar
  :fields="[
    { prop: 'keyword', label: '关键词', type: 'input' },
    { prop: 'status', label: '状态', type: 'select', options: options },
    { prop: 'createTime', label: '创建时间', type: 'date', hideInSimple: true },
    { prop: 'category', label: '分类', type: 'select', options: categories, hideInSimple: true },
  ]"
  @search="handleSearch"
/>
```
