<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    :width="width"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    append-to-body
    @close="handleClose"
  >
    <div class="sync-indicator" v-if="syncLoading">
      <el-icon class="sync-icon"><Refresh /></el-icon>
      <span>{{ t('mtable.syncing') }}</span>
    </div>
    <MForm
      ref="formRef"
      :config="config"
      :model-value="formData"
    />
    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { Component } from 'vue'
import type { FormConfig } from '../types/form'
import type { TableCrudApi, Rules } from '../types/table'
import MForm from '../MForm.vue'

const { t } = useI18n()

interface Props {
  config: FormConfig
  api?: TableCrudApi
  rowKey?: string
  width?: string | number
  titleAdd?: string
  titleEdit?: string
  customComponents?: Record<string, Component>
  syncDetailOnEdit?: boolean
  versionField?: string
  rules?: Rules
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  width: '600px',
  titleAdd: '',
  titleEdit: '',
  customComponents: () => ({}),
  syncDetailOnEdit: true,
  versionField: 'version',
  rules: () => ({}),
})

const emit = defineEmits<{
  (e: 'success', mode: 'add' | 'edit', data: Record<string, any>, index: number): void
  (e: 'close'): void
  (e: 'submit-error', error: any): void
  (e: 'sync-detail', row: Record<string, any>, index: number): void
}>()

const visible = ref(false)
const mode = ref<'add' | 'edit'>('add')
const currentRow = ref<Record<string, any> | null>(null)
const rowIndex = ref<number>(-1)
const loading = ref(false)
const syncLoading = ref(false)

const formRef = ref<InstanceType<typeof MForm> | null>(null)

const formData = ref<Record<string, any>>({})

const dialogTitle = computed(() => {
  if (mode.value === 'add') {
    return props.titleAdd || t('mtable.add')
  }
  return props.titleEdit || t('mtable.edit')
})

const config = computed(() => ({
  ...props.config,
  customComponents: props.customComponents,
  rules: props.rules,
}))

function open(dialogMode: 'add' | 'edit', row?: Record<string, any>, index?: number) {
  mode.value = dialogMode
  currentRow.value = row || null
  rowIndex.value = index ?? -1

  formData.value = {}

  if (dialogMode === 'add') {
    for (const field of props.config.fields || []) {
      formData.value[field.prop] = field.defaultValue ?? undefined
    }
    for (const group of props.config.groups || []) {
      for (const field of group.fields) {
        formData.value[field.prop] = field.defaultValue ?? undefined
      }
    }
  } else if (dialogMode === 'edit') {
    let editRow = row || {}

    for (const field of props.config.fields || []) {
      formData.value[field.prop] = editRow[field.prop] ?? field.defaultValue ?? undefined
    }
    for (const group of props.config.groups || []) {
      for (const field of group.fields) {
        formData.value[field.prop] = editRow[field.prop] ?? field.defaultValue ?? undefined
      }
    }

    currentRow.value = editRow

    if (props.syncDetailOnEdit && props.api?.getById) {
      const key = props.rowKey || 'id'
      const id = editRow[key]
      if (id) {
        syncDetailData(id, editRow)
      }
    }
  }

  visible.value = true

  nextTick(() => {
    formRef.value?.resetFields()
  })
}

async function syncDetailData(id: string, editRow: Record<string, any>) {
  syncLoading.value = true
  try {
    if (!props.api?.getById) {
      await sleep(500)
      return
    }

    const [res] = await Promise.all([
      props.api.getById(id),
      sleep(500),
    ])
    const detailRow = res?.data || res || {}

    const versionField = props.versionField
    const rowVersion = editRow[versionField]
    const detailVersion = detailRow[versionField]

    if (rowVersion === undefined || detailVersion === undefined || rowVersion === detailVersion) {
      return
    }

    ElMessage.warning(t('mtable.dataUpdated'))

    currentRow.value = detailRow

    for (const field of props.config.fields || []) {
      formData.value[field.prop] = detailRow[field.prop] ?? field.defaultValue ?? undefined
    }
    for (const group of props.config.groups || []) {
      for (const field of group.fields) {
        formData.value[field.prop] = detailRow[field.prop] ?? field.defaultValue ?? undefined
      }
    }

    emit('sync-detail', detailRow, rowIndex.value)
  } catch (error) {
    console.error('同步数据详情失败:', error)
  } finally {
    syncLoading.value = false
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function close() {
  visible.value = false
  formData.value = {}
  emit('close')
}

function handleClose() {
  close()
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true

  try {
    const data = formRef.value.getFormData()

    if (mode.value === 'add' && props.api?.create) {
      await props.api.create(data)
      ElMessage.success(t('common.addSuccess'))
    } else if (mode.value === 'edit' && props.api?.update && currentRow.value) {
      const key = props.rowKey || 'id'
      data[key] = currentRow.value[key]
      await props.api.update(data)
      ElMessage.success(t('common.updateSuccess'))
    } else {
      ElMessage.warning(t('common.noApiConfigured'))
      loading.value = false
      return
    }

    emit('success', mode.value, data, rowIndex.value)
    close()
  } catch (error) {
    emit('submit-error', error)
  } finally {
    loading.value = false
  }
}

defineExpose({
  open,
  close,
})
</script>

<style scoped lang="scss">
.sync-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  margin-bottom: 8px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .sync-icon {
    animation: spin 1s linear infinite;
    margin-right: 6px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>