import { ref, computed, watch, nextTick } from 'vue'
import type { Column } from '../../types/table'
import Sortable from 'sortablejs'

/**
 * useColumnSettings Composable
 * 
 * 职责：管理表格列的配置，包括：
 * - 列的显示/隐藏状态
 * - 列选择器的全选/反选逻辑
 * - 列的拖拽排序（使用 SortableJS）
 * - 操作列的特殊处理
 * - 列配置与 props.columns 的同步协调
 * 
 * 设计思路：
 * - 使用 columnSettings 数组维护每列的显示/隐藏状态
 * - 通过 minColumnCount 确保至少显示指定数量的列
 * - 使用 SortableJS 实现拖拽排序
 * - 操作列使用特殊标识符 ACTION_COLUMN_PROP 进行管理
 */

/** 操作列的特殊属性名（用于在 columnSettings 中标识操作列） */
export const ACTION_COLUMN_PROP = '__action__'

/**
 * useColumnSettings 入参类型定义
 */
interface UseColumnSettingsProps {
  columns?: Column[]              // 列配置数组
  minColumnCount?: number         // 最少可见列数（防止全部隐藏）
  showActionColumn?: boolean      // 是否显示操作列（显式配置）
  showView?: boolean              // 是否显示查看按钮（自动检测操作列）
  showEdit?: boolean              // 是否显示编辑按钮（自动检测操作列）
  showDelete?: boolean            // 是否显示删除按钮（自动检测操作列）
}

export function useColumnSettings(props: UseColumnSettingsProps) {
  // === 初始化 ===
  /**
   * 初始化列配置
   * 根据 props.columns 创建初始的列显示配置，并添加操作列（如果需要）
   * @returns 初始列配置数组
   */
  const initColumnSettings = () => {
    const settings = props.columns?.map((c) => ({ prop: c.prop, visible: true })) || []
    // 如果需要显示操作列，添加操作列配置
    if (actionColumn.value) {
      settings.push({ prop: ACTION_COLUMN_PROP, visible: true })
    }
    return settings
  }

  // === 操作列判断 ===
  /**
   * 是否需要显示操作列
   * 当显式设置 showActionColumn 或配置了查看/编辑/删除按钮时为 true
   */
  const actionColumn = computed(() => props.showActionColumn || props.showView || props.showEdit || props.showDelete)

  // === 状态 ===
  /** 列配置列表，每项包含 prop（列属性名）和 visible（显示状态） */
  const columnSettings = ref<{ prop: string; visible: boolean }[]>(initColumnSettings())
  /** 列选择器列表的 DOM 引用（用于绑定拖拽排序） */
  const columnDropdownListRef = ref<HTMLElement | null>(null)
  /** SortableJS 实例（用于拖拽排序） */
  let sortableInstance: Sortable | null = null

  // === 列选择器状态 ===
  /**
   * 是否全选列
   * 当所有列的 visible 都为 true 时返回 true
   */
  const isAllColumnSelected = computed(() => {
    if (!props.columns || props.columns.length === 0) return false
    return columnSettings.value.every((col) => col.visible)
  })

  /**
   * 列选择是否为半选状态
   * 当部分列可见、部分列隐藏时返回 true（用于 checkbox 的 indeterminate 状态）
   */
  const isColumnSelectionIndeterminate = computed(() => {
    if (!props.columns || props.columns.length === 0) return false
    const visibleCount = columnSettings.value.filter((col) => col.visible).length
    return visibleCount > 0 && visibleCount < columnSettings.value.length
  })

  /** 操作列是否可见 */
  const isActionColumnVisible = computed(() => {
    const actionSetting = columnSettings.value.find((col) => col.prop === ACTION_COLUMN_PROP)
    return actionSetting?.visible ?? true
  })

  // === 最少可见列数 ===
  /** 最少可见列数（默认 1，防止全部列被隐藏） */
  const minColumnCount = computed(() => props.minColumnCount ?? 1)

  // === 渲染用列配置 ===
  /**
   * 渲染用的列配置数组
   * 过滤出可见列，并确保至少显示 minColumnCount 列
   * @returns 可见列的配置数组
   */
  const renderColumns = computed(() => {
    if (!props.columns || props.columns.length === 0) return []

    // 过滤出数据列（排除操作列）
    const dataColumns = columnSettings.value.filter((col) => col.prop !== ACTION_COLUMN_PROP)

    // 获取当前可见的数据列属性名
    let visible = dataColumns.filter((col) => col.visible).map((col) => col.prop)

    // 如果没有可见列，强制显示前 minColumnCount 列
    if (visible.length === 0) {
      visible = dataColumns.slice(0, minColumnCount.value).map((col) => col.prop)
    }

    // 如果可见列数不足，补充隐藏的列
    if (visible.length < minColumnCount.value) {
      const hidden = dataColumns.filter((col) => !visible.includes(col.prop)).map((col) => col.prop)
      const additional = hidden.slice(0, minColumnCount.value - visible.length)
      visible = [...visible, ...additional]
    }

    // 根据属性名映射回完整的列配置对象
    return visible
      .map((prop) => props.columns!.find((c) => c.prop === prop))
      .filter(Boolean) as Column[]
  })

  // === 列配置协调 ===
  /**
   * 协调列配置与 props.columns 的同步
   * 当 props.columns 变化时：
   * - 移除已不存在的列配置
   * - 添加新列的配置（默认可见）
   * - 确保操作列配置正确
   */
  const reconcileColumnSettings = () => {
    // 创建当前列属性名的集合
    const columnPropSet = new Set(props.columns?.map((c) => c.prop) || [])

    // 过滤掉已不存在的列（保留操作列和仍存在的数据列）
    const currentSettings = columnSettings.value.filter(
      (col) => col.prop === ACTION_COLUMN_PROP || columnPropSet.has(col.prop)
    )

    // 创建已存在配置的属性名集合
    const existingProps = new Set(currentSettings.map((col) => col.prop))

    // 添加新列的配置（默认可见）
    props.columns?.forEach((col) => {
      if (!existingProps.has(col.prop)) {
        currentSettings.push({ prop: col.prop, visible: true })
      }
    })

    // 如果需要操作列但尚未添加，添加操作列配置
    if (actionColumn.value && !existingProps.has(ACTION_COLUMN_PROP)) {
      currentSettings.push({ prop: ACTION_COLUMN_PROP, visible: true })
    }

    // 更新列配置
    columnSettings.value = currentSettings
  }

  // === 列选择器事件处理 ===
  /**
   * 全选/反选列处理
   * @param checked - 是否全选
   */
  const handleSelectAllColumn = (checked: any) => {
    if (checked === true) {
      // 全选：所有列可见
      columnSettings.value.forEach((col) => (col.visible = true))
    } else {
      // 反选：操作列始终可见，数据列按 minColumnCount 保留
      let dataColumnIndex = 0
      columnSettings.value.forEach((col) => {
        if (col.prop === ACTION_COLUMN_PROP) {
          col.visible = true
        } else {
          col.visible = dataColumnIndex < minColumnCount.value
          dataColumnIndex++
        }
      })
    }
  }

  /**
   * 单个列显示/隐藏切换处理
   * @param prop - 列属性名
   * @param checked - 是否显示
   */
  const handleColumnToggle = (prop: string, checked: any) => {
    const setting = columnSettings.value.find((col) => col.prop === prop)
    if (setting) {
      if (checked) {
        // 显示列
        setting.visible = true
      } else {
        // 隐藏列
        if (prop === ACTION_COLUMN_PROP) {
          // 操作列可以直接隐藏
          setting.visible = false
        } else {
          // 数据列需要检查是否满足最少可见列数
          const dataColumns = columnSettings.value.filter((col) => col.prop !== ACTION_COLUMN_PROP)
          const visibleDataCount = dataColumns.filter((col) => col.visible).length
          // 只有当前可见列数大于最少列数时才能隐藏
          if (visibleDataCount > minColumnCount.value) {
            setting.visible = false
          }
        }
      }
    }
  }

  /**
   * 重置列配置
   * 将所有列恢复为可见状态
   */
  const handleResetColumns = () => {
    const settings = props.columns?.map((c) => ({ prop: c.prop, visible: true })) || []
    if (actionColumn.value) {
      settings.push({ prop: ACTION_COLUMN_PROP, visible: true })
    }
    columnSettings.value = settings
  }

  // === 拖拽排序 ===
  /**
   * 初始化 SortableJS 拖拽排序
   * 绑定到列选择器列表，支持拖拽调整列顺序
   */
  const initSortable = () => {
    if (!columnDropdownListRef.value || sortableInstance) return
    sortableInstance = new Sortable(columnDropdownListRef.value, {
      handle: '.column-drag-handle',   // 拖拽手柄选择器
      animation: 150,                   // 动画时长（毫秒）
      ghostClass: 'column-drag-ghost',  // 拖拽时占位样式
      dragClass: 'column-drag-drag',    // 拖拽时元素样式
      onEnd: (evt) => {
        // 拖拽结束时更新列配置顺序
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          const item = columnSettings.value.splice(oldIndex, 1)[0]
          columnSettings.value.splice(newIndex, 0, item)
        }
      }
    })
  }

  /**
   * 销毁 SortableJS 实例
   * 释放资源，防止内存泄漏
   */
  const destroySortable = () => {
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }
  }

  /**
   * 列选择器下拉框显示/隐藏变化处理
   * 在下拉框显示时初始化拖拽，隐藏时销毁拖拽
   * @param visible - 下拉框是否可见
   */
  const handleDropdownVisibleChange = async (visible: boolean) => {
    if (visible) {
      // 等待 DOM 更新完成后初始化拖拽
      await nextTick()
      initSortable()
    } else {
      // 隐藏时销毁拖拽实例
      destroySortable()
    }
  }

  // === 监听 ===
  /** 监听 props.columns 变化，同步列配置 */
  watch(() => props.columns, reconcileColumnSettings, { deep: true, immediate: true })

  /** 监听操作列状态变化，添加/移除操作列配置 */
  watch(actionColumn, (val) => {
    if (val) {
      // 需要显示操作列但尚未添加
      if (!columnSettings.value.some((col) => col.prop === ACTION_COLUMN_PROP)) {
        columnSettings.value.push({ prop: ACTION_COLUMN_PROP, visible: true })
      }
    } else {
      // 不需要显示操作列，移除操作列配置
      columnSettings.value = columnSettings.value.filter((col) => col.prop !== ACTION_COLUMN_PROP)
    }
  }, { immediate: true })

  // === 返回值 ===
  return {
    ACTION_COLUMN_PROP,              // 操作列特殊属性名
    actionColumn,                    // 是否需要显示操作列
    columnSettings,                  // 列配置列表
    columnDropdownListRef,           // 列选择器列表引用
    isAllColumnSelected,             // 是否全选列
    isColumnSelectionIndeterminate,  // 列选择是否为半选状态
    isActionColumnVisible,           // 操作列是否可见
    renderColumns,                   // 渲染用的列配置（仅可见列）
    handleSelectAllColumn,           // 全选/反选列处理
    handleColumnToggle,              // 单个列显示/隐藏切换
    handleResetColumns,              // 重置列配置
    handleDropdownVisibleChange,     // 下拉框显示/隐藏变化处理
    reconcileColumnSettings          // 列配置协调
  }
}