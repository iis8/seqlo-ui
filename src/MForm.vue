<template>
  <el-form
    ref="formRef"
    :model="formData"
    :label-width="labelWidth"
    :rules="formRules"
    class="m-form"
  >
    <template v-if="config.fields?.length">
      <el-row :gutter="gutter">
        <el-col
          v-for="field in visibleFields(config.fields)"
          :key="field.prop"
          :span="field.colSpan || 12"
        >
          <el-form-item
            :label="field.label"
            :prop="field.prop"
            :rules="field.rules"
            :required="field.required"
          >
            <FieldRenderer
              :field="field"
              v-model="formData[field.prop]"
              :custom-components="config.customComponents"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </template>
    <template v-for="(group, groupIndex) in config.groups" :key="groupIndex">
      <div v-if="group.collapsible" class="group-header" @click="toggleGroup(groupIndex)">
        <span class="group-title">{{ group.title }}</span>
        <el-icon :class="{ expanded: !group.collapsed }">
          <ArrowDown />
        </el-icon>
      </div>
      <div v-else-if="group.title" class="group-divider">
        <el-divider content-position="left">{{ group.title }}</el-divider>
      </div>
      <div v-show="!group.collapsed || !group.collapsible" class="group-content">
        <el-row :gutter="group.gutter || gutter">
          <el-col
            v-for="field in visibleFields(group.fields)"
            :key="field.prop"
            :span="field.colSpan || 12"
          >
            <el-form-item
              :label="field.label"
              :prop="field.prop"
              :rules="field.rules"
              :required="field.required"
            >
              <FieldRenderer
                :field="field"
                v-model="formData[field.prop]"
                :custom-components="config.customComponents"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </template>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import type { Component } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormConfig, FormField, FormGroup } from './types/form'
import FieldRenderer from './FieldRenderer.vue'

interface Props {
  config: FormConfig
  modelValue?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'change', value: Record<string, any>): void
}>()

const formRef = ref<FormInstance>()

const labelWidth = computed(() => props.config.labelWidth || '120px')
const gutter = computed(() => props.config.gutter || 20)

const formRules = computed(() => {
  const rules: Record<string, any[]> = { ...props.config.rules }
  for (const field of props.config.fields || []) {
    if (field.rules) {
      rules[field.prop] = [...(rules[field.prop] || []), ...field.rules]
    }
  }
  for (const group of props.config.groups || []) {
    for (const field of group.fields) {
      if (field.rules) {
        rules[field.prop] = [...(rules[field.prop] || []), ...field.rules]
      }
    }
  }
  return rules
})

const expandedGroups = ref<Record<number, boolean>>({})

function initFormData(): Record<string, any> {
  const data: Record<string, any> = {}
  for (const field of props.config.fields || []) {
    data[field.prop] = field.defaultValue ?? undefined
  }
  for (const group of props.config.groups || []) {
    for (const field of group.fields) {
      data[field.prop] = field.defaultValue ?? undefined
    }
  }
  Object.assign(data, props.modelValue)
  return data
}

const formData = reactive(initFormData())

function visibleFields(fields: FormField[]): FormField[] {
  return fields.filter(f => f.visible !== false)
}

function toggleGroup(index: number) {
  const group = props.config.groups?.[index]
  if (group?.collapsible) {
    group.collapsed = !group.collapsed
  }
}

async function validate(callback?: (valid: boolean) => void): Promise<boolean> {
  if (!formRef.value) return true
  return formRef.value.validate(callback)
}

async function resetFields() {
  await nextTick()
  formRef.value?.resetFields()
  for (const field of props.config.fields || []) {
    formData[field.prop] = props.modelValue?.[field.prop] ?? field.defaultValue ?? undefined
  }
  for (const group of props.config.groups || []) {
    for (const field of group.fields) {
      formData[field.prop] = props.modelValue?.[field.prop] ?? field.defaultValue ?? undefined
    }
  }
}

function getFormData(): Record<string, any> {
  const data: Record<string, any> = {}
  for (const field of visibleFields(props.config.fields || [])) {
    data[field.prop] = formData[field.prop]
  }
  for (const group of props.config.groups || []) {
    for (const field of visibleFields(group.fields)) {
      data[field.prop] = formData[field.prop]
    }
  }
  return data
}

watch(
  () => props.modelValue,
  (val) => {
    for (const field of props.config.fields || []) {
      formData[field.prop] = val?.[field.prop] ?? field.defaultValue ?? undefined
    }
    for (const group of props.config.groups || []) {
      for (const field of group.fields) {
        formData[field.prop] = val?.[field.prop] ?? field.defaultValue ?? undefined
      }
    }
  },
  { deep: true }
)

watch(
  formData,
  () => {
    const data = getFormData()
    emit('update:modelValue', data)
    emit('change', data)
  },
  { deep: true }
)

defineExpose({
  validate,
  resetFields,
  getFormData,
})
</script>

<style scoped lang="scss">
.m-form {
  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .group-title {
      flex: 1;
    }

    .el-icon {
      transition: transform 0.3s ease;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }

  .group-divider {
    margin: 16px 0;
  }

  .group-content {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-col {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
  }
}
</style>