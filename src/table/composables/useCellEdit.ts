import type { Column, TableCrudApi, Rules } from '../../types/table'
import { set } from 'lodash-es'
import { validateField } from '../utils/validate'

/**
 * useCellEdit Composable
 * 
 * 职责：管理表格单元格内联编辑功能
 * 
 * 设计思路：
 * - 支持 API 模式和事件模式
 * - API 模式：调用 api.updateByField 接口更新单个字段
 * - 事件模式：触发 cell-change 事件，由父组件处理
 * - 使用 lodash 的 set 方法更新行数据（支持嵌套属性）
 */

/**
 * useCellEdit 入参类型定义
 */
interface UseCellEditProps {
  api?: TableCrudApi  // CRUD API 接口对象
  rules?: Rules       // 表单验证规则
}

export function useCellEdit(
  props: UseCellEditProps,
  emit: (event: string, ...args: any[]) => void,
  internalLoading: { value: boolean }  // 加载状态（来自 useTableState）
) {
  /**
   * 单元格编辑变化处理
   * 支持 API 模式和事件模式两种方式
   * @param row - 行数据
   * @param col - 列配置
   * @param value - 新值
   */
  const handleEditChange = async (row: any, col: Column, value: any) => {
    const fieldRules = col.rules || props.rules?.[col.prop]
    if (fieldRules && !(await validateField(fieldRules, value, col.prop))) {
      return
    }

    if (!props.api?.updateByField) {
      // 事件模式：触发 cell-change 事件，由父组件处理
      emit('cell-change', { row, col, value })
      return
    }

    // API 模式：调用字段更新接口
    internalLoading.value = true
    try {
      // 调用 updateByField 接口更新字段值
      await props.api.updateByField(row.id, col.prop, value)
      // 使用 lodash 的 set 更新行数据（支持嵌套属性）
      set(row, col.prop, value)
    } finally {
      internalLoading.value = false
    }
  }

  // === 返回值 ===
  return {
    handleEditChange   // 单元格编辑变化处理
  }
}