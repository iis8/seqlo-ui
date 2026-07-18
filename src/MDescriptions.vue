<template>
  <el-descriptions
    :column="column"
    :border="border"
    :size="size"
    :title="title"
    v-bind="$attrs"
    v-on="$attrs"
    v-loading="loading"
  >
    <el-descriptions-item
      v-for="field in fields"
      :key="field.prop"
      :label="field.label"
      :span="field.span"
      :width="field.width"
      :min-width="field.minWidth"
      :align="field.align"
      :label-align="field.labelAlign"
    >
      <FieldEditor
        :model-value="get(modelValue, field.prop)"
        :field="field"
        :editable="editable && field.editable !== false"
        :custom-components="customComponents"
        :row="modelValue"
        @change="(val: any) => handleFieldChange(field, val)"
      >
        <template v-if="field.slot" #default>
          <slot :name="field.slot === true ? field.prop : field.slot" :value="get(modelValue, field.prop)" :field="field" />
        </template>
      </FieldEditor>
    </el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import type { DescriptionsField, DescriptionsApi, Rules } from './types/descriptions'
import { get, set } from 'lodash-es'
import FieldEditor from './FieldEditor.vue'
import { validateField } from './table/utils/validate'

interface Props {
  modelValue?: Record<string, any>
  fields?: DescriptionsField[]
  column?: number
  border?: boolean
  size?: '' | 'default' | 'small' | 'large'
  title?: string
  editable?: boolean
  api?: DescriptionsApi
  idField?: string
  customComponents?: Record<string, Component>
  rules?: Rules
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  fields: () => [],
  column: 3,
  border: false,
  size: 'default',
  editable: true,
  idField: 'id',
  customComponents: () => ({}),
  rules: () => ({}),
})

const emit = defineEmits(['update:modelValue', 'field-change', 'update-success', 'update-error'])

const loading = ref(false)

async function handleFieldChange(field: DescriptionsField, value: any) {
  const fieldRules = field.rules || props.rules?.[field.prop]
  if (fieldRules && !(await validateField(fieldRules, value, field.prop))) {
    return
  }

  if (!props.api?.updateByField) {
    emit('field-change', { field, value })
    return
  }

  const id = get(props.modelValue, props.idField)
  if (!id) return

  loading.value = true
  try {
    await props.api.updateByField(String(id), field.prop, value)
    set(props.modelValue, field.prop, value)
    emit('update:modelValue', { ...props.modelValue })
    emit('field-change', { field, value })
    emit('update-success', { field, value })
  } catch (error) {
    emit('update-error', { field, value, error })
  } finally {
    loading.value = false
  }
}
</script>