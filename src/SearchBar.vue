<template>
  <div class="search-bar__container" @keyup.enter="handleSearch">
    <!-- 简单模式 -->
    <div v-if="currentMode === 'simple'" class="simple-search">
      <div class="simple-search-box">
        <!-- 搜索字段选择下拉 -->
        <el-select
          v-model="activeSimpleProp"
          class="field-select"
          popper-class="field-select-dropdown"
          @change="handleFeildChange"
        >
          <el-option
            v-for="field in simpleFields"
            :key="field.prop"
            :label="field.label"
            :value="field.prop"
          />
        </el-select>
        <!-- 动态字段输入 -->
        <FieldRenderer class="field-component"
          v-if="activeSimpleField"
          ref="fieldRendererRef"
          :field="activeSimpleField"
          v-model="formData[activeSimpleProp]"
          :custom-components="customComponents"
          @change="handleValueChange"
        />
        <!-- 搜索按钮 -->
        <el-button class="search-btn" @click="handleSearch">
          <el-icon><Search /></el-icon>
        </el-button>
      </div>
      <div class="action-buttons">
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="showModeToggle" @click="toggleMode">高级</el-button>
      </div>
    </div>

    <!-- 高级模式 -->
    <el-form v-else label-width="100px">
      <el-row :gutter="16">
        <el-col v-for="field in fields" :key="field.prop" :span="field.colSpan || 8">
          <el-form-item :label="field.label">
            <FieldRenderer
              :field="field"
              v-model="formData[field.prop]"
              :custom-components="customComponents"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <div class="advanced-actions">
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="showModeToggle" @click="toggleMode">收起</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { Search } from '@element-plus/icons-vue'
import type { SearchField } from './types'
import FieldRenderer from './FieldRenderer.vue'

// ======================== Props & Emits ========================
const props = withDefaults(defineProps<{
  fields: SearchField[]
  modelValue?: Record<string, any>
  mode?: 'simple' | 'advanced'
  showModeToggle?: boolean
  customComponents?: Record<string, any>
}>(), {
  modelValue: () => ({}),
  mode: 'simple',
  showModeToggle: true,
  customComponents: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'search', value: Record<string, any>): void
  (e: 'reset'): void
  (e: 'change', value: Record<string, any>): void
  (e: 'mode-change', mode: 'simple' | 'advanced'): void
  (e: 'update:mode', mode: 'simple' | 'advanced'): void
}>()

// ======================== 状态管理 ========================
const currentMode = ref(props.mode)

// 简单搜索字段输入组件实例引用
const fieldRendererRef = ref()

// 初始化表单数据
function initFormData(): Record<string, any> {
  const data: Record<string, any> = {}
  for (const field of props.fields) {
    data[field.prop] = field.defaultValue ?? undefined
  }
  Object.assign(data, props.modelValue)
  return data
}
const formData = reactive(initFormData())

// 简单模式显示的字段，默认全部显示（hideInSimple !== true）
const simpleFields = computed(() => {
  const list = props.fields.filter(f => !f.hideInSimple)
  if (list.length > 0) return list
  // 兜底：取第一个 input 类型字段
  const firstInput = props.fields.find(f => f.component === 'input')
  if (firstInput) return [firstInput]
  // 如果连 input 都没有，生成一个虚拟字段
  return [{
    prop: 'keyword',
    label: '关键词',
    component: 'el-input',
    placeholder: '请输入搜索内容'
  } as SearchField]
})

// 当前选中的简单搜索字段 prop
const activeSimpleProp = ref<string>('')
// 当前选中的简单搜索字段对象
const activeSimpleField = computed<SearchField | undefined>(() => {
  return simpleFields.value.find(f => f.prop === activeSimpleProp.value)
})

// 初始化默认选中第一个简单字段
watch(simpleFields, (list) => {
  if (list.length > 0 && !activeSimpleProp.value) {
    activeSimpleProp.value = list[0].prop
  }
}, { immediate: true })

// 同步外部 mode 变化（支持受控模式）
watch(() => props.mode, (val) => {
  currentMode.value = val
})

// 同步外部 modelValue（用于回显或外部重置）
watch(() => props.modelValue, (val) => {
  if (val) {
    for (const key of Object.keys(formData)) {
      if (val[key] !== undefined) formData[key] = val[key]
    }
  }
}, { deep: true })

// ======================== 工具函数 ========================
function getQueryParams(): Record<string, any> {
  const params: Record<string, any> = {}
  if (currentMode.value === 'simple') {
    if (!activeSimpleField.value) return params
    const field = activeSimpleField.value
    const rawValue = formData[field.prop]
    if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
      if (field.transform) {
        Object.assign(params, field.transform(rawValue))
      } else {
        params[field.prop] = rawValue
      }
    }
  } else {
    for (const field of props.fields) {
      const rawValue = formData[field.prop]
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        if (field.transform) {
          Object.assign(params, field.transform(rawValue))
        } else {
          params[field.prop] = rawValue
        }
      }
    }
  }
  return params
}

// ======================== 事件处理 ========================
function handleSearch() {
  const query = getQueryParams()
  emit('update:modelValue', query)
  emit('search', query)
}

function handleReset() {
  if (currentMode.value === 'simple') {
    // 简单模式只重置当前字段
    if (activeSimpleField.value) {
      formData[activeSimpleField.value.prop] = activeSimpleField.value.defaultValue ?? undefined
    }
  } else {
    for (const field of props.fields) {
      formData[field.prop] = field.defaultValue ?? undefined
    }
  }
  emit('reset')
}

/**
 * 
 * @param value 变化的值
 */
function handleValueChange(value: any) {
  if (activeSimpleField.value?.searchOnChange) {
    handleSearch()
  }
}

async function handleFeildChange() {
  await nextTick()
  fieldRendererRef.value?.focus?.()
}

function toggleMode() {
  currentMode.value = currentMode.value === 'simple' ? 'advanced' : 'simple'
  emit('mode-change', currentMode.value)
  emit('update:mode', currentMode.value)
}
</script>

<style scoped lang="scss">
.search-bar__container {
  .simple-search {
    display: flex;
    align-items: center;
    gap: 8px;

    .simple-search-box {
      display: flex;
      align-items: center;
      flex: 1;
      border: 1px solid var(--el-border-color);
      border-radius: 5px;
      overflow: hidden;
      background: var(--el-bg-color);

      // 匹配所有 el-xxx__wrapper 输入容器
      :deep([class*="el-"][class*="__wrapper"]) {
        border: 0 !important;
        box-shadow: none !important;
      }
      // 强制清除 hover / focus 高亮阴影
      :deep(
        [class*="el-"][class*="__wrapper"]:hover,
        [class*="el-"][class*="__wrapper"].is-focus
      ) {
        box-shadow: none !important;
      }
    }

    .field-select {
      flex-shrink: 0;
      width: 100px;
    }

    .field-component {
      min-width: 200px;
    }

    .search-btn {
      border-radius: 0;
      height: 32px;
      margin: 0;
      border: none;
      padding: 0 16px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }

  .advanced-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>