<template>
  <div class="field-editor">
    <template v-if="isEditing || props.field?.inlineEdit">
      <FieldRenderer
        ref="fieldRendererRef"
        :field="editField"
        :model-value="isEditing ? editValue : modelValue"
        :custom-components="customComponents"
        @update:model-value="handleUpdate"
        @change="handleChange"
        @blur="handleConfirm"
        @keyup.enter="handleConfirm"
        @keyup.esc="exitEditMode"
      />
    </template>
    <template v-else>
      <div class="cell-content">
        <div class="cell-content__main" :class="{ 'cell-content__main--ellipsis': showOverflowTooltip }">
          <template v-if="$slots.default">
            <slot :value="modelValue" />
          </template>
          <template v-else-if="renderResult">
            <component :is="() => renderResult" />
          </template>
          <template v-else-if="props.field?.component">
            <FieldRenderer
              :field="props.field"
              :model-value="modelValue"
              :custom-components="customComponents"
              @update:model-value="(val: any) => emit('update:modelValue', val)"
              @change="(val: any) => emit('change', val)"
            />
          </template>
          <template v-else-if="props.field?.formatter">
            {{ (props.field.formatter as any).length === 4 
              ? (props.field.formatter as any)(props.row, props.field, props.modelValue, props.index ?? 0)
              : (props.field.formatter as any)(props.modelValue)
            }}
          </template>
          <template v-else>
            {{ modelValue }}
          </template>
        </div>
        <span
          v-if="editable === true"
          class="edit-icon"
          @click="enterEditMode"
        >
          ✎
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import type { Field, EditableFieldConfig, FieldEditorScope } from './types/field'
import FieldRenderer from './FieldRenderer.vue'

interface Props {
  modelValue?: any
  field?: EditableFieldConfig<any>
  editable?: boolean
  //自定义组件列表
  customComponents?: Record<string, Component>
  // 在表格中使用时，需要传递 row 和 index 参数
  row?: any
  index?: number
  showOverflowTooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  customComponents: () => ({}),
  showOverflowTooltip: true,
})

defineSlots<{
  default: (props: { value: any }) => any
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const isEditing = ref(false)
const fieldRendererRef = ref()
const editValue = ref<any>(undefined)

const scope = computed<FieldEditorScope>(() => ({
  value: props.modelValue,
}))

const editField = computed<Field>(() => {
  const f = props.field
  const baseProps = f?.editComponentProps
    ? typeof f.editComponentProps === 'function'
      ? f.editComponentProps(scope.value)
      : f.editComponentProps
    : f?.componentProps
  const componentProps = f?.inlineEdit
    ? { disabled: !props.editable, ...baseProps }
    : baseProps
  return {
    ...f,
    prop: f?.prop || '',
    component: f?.editComponent || f?.component || 'Input',
    componentProps,
    componentListeners: f?.editComponentListeners
      ? typeof f.editComponentListeners === 'function'
        ? f.editComponentListeners(scope.value)
        : f.editComponentListeners
      : f?.componentListeners,
  }
})

const renderResult = computed(() => {
  if (!props.field?.render) return undefined
  return props.field.render({ value: props.modelValue, row: props.row, $index: props.index, column: props.field } as any)
})

function enterEditMode() {
  if (props.editable !== true) return
  editValue.value = props.modelValue
  isEditing.value = true
  setTimeout(() => {
    fieldRendererRef.value?.focus?.()
  }, 50)
}

function exitEditMode() {
  isEditing.value = false
}

function handleUpdate(value: any) {
  editValue.value = value
  emit('update:modelValue', value)
}

function handleChange(value: any) {
  if (props.field?.updateOnChange) {
    emit('change', value)
    exitEditMode()
  }
}

function handleConfirm() {
  if (!props.field?.updateOnChange && editValue.value !== props.modelValue) {
    emit('update:modelValue', editValue.value)
    emit('change', editValue.value)
  }
  exitEditMode()
}
</script>

<style scoped>
.field-editor {
  width: 100%;
}

.cell-content {
  display: flex;
  align-items: center;
  min-height: 25px;
}

.cell-content__main {
  flex: 1;
  min-width: 0;
}

.cell-content__main--ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.edit-icon {
  display: none;
  margin-left: 4px;
  cursor: pointer;
  color: var(--el-color-primary);
  font-size: 14px;
  padding: 2px;
  border-radius: 2px;
  box-shadow: 0 0 2px rgba(0,0,0,0.1);
}

.cell-content:hover .edit-icon {
  display: inline-block;
}
</style>