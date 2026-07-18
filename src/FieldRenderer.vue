<template>
  <div class="field-renderer">
    <!-- select 类型需要额外渲染 el-option，单独处理 -->
    <template v-if="field.component === 'select'">
      <el-select
        ref="fieldRef"
        v-model="currentValue"
        :automatic-dropdown="true"
        v-bind="selectProps"
        v-on="field.componentListeners || {}"
        @change="emit('change', $event)"
        @blur="emit('blur', $event)"
        @keyup="emit('keyup', $event)"
      >
        <el-option
          v-for="opt in resolvedOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </template>
    <!-- 其他类型（内置和自定义）统一使用动态组件 -->
    <template v-else>
      <component
        ref="fieldRef"
        :is="resolvedComponent"
        v-model="currentValue"
        @change="$emit('change', $event)"
        @blur="emit('blur', $event)"
        @keyup="emit('keyup', $event)"
        v-bind="mergedProps"
        v-on="mergedListeners"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import type { Component } from 'vue'
import type { Field, FieldOption } from './types'
import {
  resolveFieldComponent,
  mergeComponentProps,
  mergeComponentListeners
} from './utils/resolveComponent'

interface Props {
  field: Field
  modelValue?: any
  customComponents?: Record<string, Component>
}

const props = withDefaults(defineProps<Props>(), {
  customComponents: () => ({}),
})

const emit = defineEmits(['update:modelValue', 'blur', 'keyup', 'change'])

const fieldRef = ref()

async function focus() {
  await nextTick()
  fieldRef.value?.focus?.()
}

defineExpose({
  focus,
})

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 默认组件
const DEFAULT_COMPONENT = 'el-input'

// 解析最终的渲染组件
const resolvedComponent = computed(() => {
  return resolveFieldComponent(
    props.field.component || DEFAULT_COMPONENT,
    props.customComponents,
  )
})

// 合并后的普通控件 props
const mergedProps = computed(() => {
  const base = {
    placeholder: props.field.placeholder,
    clearable: true,
    disabled: props.field.disabled,
  }
  const merged = mergeComponentProps(base, props.field.componentProps)
  return merged
})

// select 专用 props（避免将 options 作为属性传入）
const selectProps = computed(() => {
  const { options, loadOptions, ...rest } = mergedProps.value
  return rest
})

// 合并后的事件监听器
const mergedListeners = computed(() => {
  return mergeComponentListeners(props.field.componentListeners)
})

// 选项解析（静态 / 动态）
const staticOptions = ref<FieldOption[]>([])
const dynamicOptions = ref<FieldOption[]>([])

const resolvedOptions = computed(() => {

  if (props.field.loadOptions) {
    return dynamicOptions.value
  }
  // 静态选项优先
  return props.field.options || staticOptions.value
})

onMounted(async () => {
  // 选择器初始化
  // 静态选项初始化
  if (props.field.options) {
    staticOptions.value = props.field.options
  }
  // 动态加载
  if (props.field.loadOptions) {
    dynamicOptions.value = await props.field.loadOptions()
  }
})
</script>

<style scoped lang="scss">
.field-renderer {
  width: 100%;
}
</style>