import { ref, computed } from 'vue'
import type { Column } from '../../types/table'
import type { Field } from '../../types/field'
import type { TableCrudApi, Rules } from '../../types/table'
import { ElMessageBox, ElMessage } from 'element-plus'
import { validateField } from '../utils/validate'

/**
 * useBatchActions Composable
 * 
 * 职责：管理表格的批量操作功能，包括：
 * - 批量编辑对话框的状态管理
 * - 批量编辑字段配置转换
 * - 批量编辑确认处理（API 调用或事件触发）
 * - 批量删除处理（包含确认弹窗）
 * 
 * 设计思路：
 * - 使用 ref 管理批量编辑对话框的可见性、选中字段和值
 * - 通过 computed 将 Column 配置转换为 Field 配置供 FieldRenderer 使用
 * - 支持 API 模式和事件模式两种处理方式
 */

/**
 * useBatchActions 入参类型定义
 */
interface UseBatchActionsProps {
  api?: TableCrudApi              // CRUD API 接口对象
  rowKey?: string                 // 行唯一标识字段（用于构建 ID 列表）
  batchEditableColumns: Column[]   // 可批量编辑的列列表
  selectedRows: any[]             // 当前选中的行列表
  confirmDelete?: boolean         // 删除是否需要确认弹窗
  rules?: Rules                   // 表单验证规则
}

export function useBatchActions(props: UseBatchActionsProps, emit: (event: string, ...args: any[]) => void) {
  // === 批量编辑对话框状态 ===
  /** 批量编辑对话框是否可见 */
  const batchEditDialogVisible = ref(false)
  /** 当前选中的批量编辑字段（Column 对象） */
  const batchEditField = ref<Column | undefined>(undefined)
  /** 当前输入的批量编辑值 */
  const batchEditValue = ref<any>(undefined)

  // === 字段配置转换 ===
  /**
   * 批量编辑字段配置（转换为 Field 格式供 FieldRenderer 使用）
   * 将 Column 配置转换为 Field 配置，支持函数类型的属性解析
   */
  const batchEditFieldConfig = computed<Field>(() => {
    const col = batchEditField.value
    if (!col) return { prop: '' }
    const scope = { value: batchEditValue.value }
    /** 解析属性值，如果是函数则执行 */
    const resolveFn = <T>(val: T | ((s: any) => T) | undefined): T | undefined =>
      typeof val === 'function' ? (val as any)(scope) : val
    return {
      prop: col.prop,
      label: col.label,
      placeholder: col.placeholder,
      component: col.editComponent,           // 使用编辑组件
      componentProps: resolveFn(col.editComponentProps),  // 解析组件属性
      componentListeners: resolveFn(col.editComponentListeners),  // 解析组件事件
      options: col.options,                   // 下拉选项
      loadOptions: col.loadOptions            // 异步加载选项
    }
  })

  // === 批量编辑对话框操作 ===
  /**
   * 打开批量编辑对话框
   * 重置选中字段和值，显示对话框
   */
  const openBatchEditDialog = () => {
    batchEditField.value = undefined
    batchEditValue.value = undefined
    batchEditDialogVisible.value = true
  }

  /**
   * 批量编辑字段变化处理
   * 当切换编辑字段时，清空之前输入的值
   */
  const handleBatchEditFieldChange = () => {
    batchEditValue.value = undefined
  }

  /**
   * 批量编辑确认处理
   * @param doLoad - 数据重新加载函数
   * @param setLoading - 加载状态设置函数
   */
  const handleBatchEditConfirm = async (doLoad: () => Promise<void>, setLoading: (val: boolean) => void) => {
    const col = batchEditField.value
    if (!col) {
      // 没有选中字段，直接关闭对话框
      batchEditDialogVisible.value = false
      return
    }

    const fieldRules = col.rules || props.rules?.[col.prop]
    if (fieldRules && !(await validateField(fieldRules, batchEditValue.value, col.prop))) {
      return
    }
    
    // 获取选中行的 ID 列表
    const key = props.rowKey || 'id'
    const ids = props.selectedRows.map((row: any) => row[key])
    
    if (props.api?.batchUpdateField) {
      // API 模式：调用批量更新接口
      setLoading(true)
      try {
        await props.api.batchUpdateField(ids, col.prop, batchEditValue.value)
        // 更新成功后重新加载数据
        await doLoad()
      } finally {
        setLoading(false)
      }
    } else {
      // 事件模式：触发 batch-edit 事件，由父组件处理
      emit('batch-edit', {
        rows: props.selectedRows,
        ids,
        field: col.prop,
        value: batchEditValue.value
      })
    }
    
    // 关闭对话框
    batchEditDialogVisible.value = false
  }

  // === 批量删除处理 ===
  /**
   * 批量删除处理
   * @param doLoad - 数据重新加载函数
   * @param setLoading - 加载状态设置函数
   */
  const handleBatchDelete = async (doLoad: () => Promise<void>, setLoading: (val: boolean) => void) => {
    // 获取选中行的 ID 列表
    const key = props.rowKey || 'id'
    const ids = props.selectedRows.map((row: any) => row[key])

    try {
      // 如果需要确认弹窗，弹出确认对话框
      if (props.confirmDelete !== false) {
        await ElMessageBox.confirm(
          '确认批量删除选中的 {count} 条记录？',
          '',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      }

      if (props.api?.batchDelete) {
        // API 模式：调用批量删除接口
        setLoading(true)
        await props.api.batchDelete(ids)
        ElMessage.success('删除成功')
        // 删除成功后重新加载数据
        await doLoad()
      } else {
        // 事件模式：触发 batch-delete 事件，由父组件处理
        emit('batch-delete', props.selectedRows)
      }
    } catch {
      // 用户取消或关闭对话框，不做任何操作
    } finally {
      setLoading(false)
    }
  }

  // === 返回值 ===
  return {
    batchEditDialogVisible,        // 批量编辑对话框可见性
    batchEditField,                // 当前选中的批量编辑字段
    batchEditValue,                // 当前输入的批量编辑值
    batchEditFieldConfig,          // 批量编辑字段配置（Field 格式）
    openBatchEditDialog,           // 打开批量编辑对话框
    handleBatchEditFieldChange,    // 批量编辑字段变化处理
    handleBatchEditConfirm,        // 批量编辑确认处理
    handleBatchDelete              // 批量删除处理
  }
}