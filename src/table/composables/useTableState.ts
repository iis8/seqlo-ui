import { ref, computed, watch } from 'vue'
import type { Column, BatchAction, TableCrudApi } from '../../types/table'

/**
 * useTableState Composable
 * 
 * 职责：管理表格核心状态，包括：
 * - API 模式/本地数据模式的适配
 * - 数据、分页、选中状态管理
 * - 批量操作相关状态
 * - 搜索模式管理
 * - 表格尺寸管理
 * 
 * 设计思路：
 * - 通过 isApiMode 区分 API 模式和本地数据模式
 * - 提供 renderData/renderTotal/renderLoading 等计算属性实现模式适配
 * - 使用 computed setter 实现分页器的双向绑定
 */

/**
 * useTableState 入参类型定义
 */
interface UseTableStateProps {
  api?: TableCrudApi                          // CRUD API 接口对象
  columns?: Column[]                          // 列配置数组
  tableData?: any[]                           // 本地数据模式下的数据
  total?: number                              // 本地数据模式下的总条数
  pageSize?: number                           // 每页条数
  currentPage?: number                        // 当前页码
  size?: '' | 'default' | 'small' | 'large'   // 表格尺寸
  loadingState?: boolean                      // 本地数据模式下的加载状态
  batchActions?: BatchAction[]                // 自定义批量操作
  showBatchEdit?: boolean                     // 是否显示批量编辑
  showBatchDelete?: boolean                   // 是否显示批量删除
  batchEditDisabled?: (selectedRows: any[]) => boolean  // 批量编辑禁用条件
  batchDeleteDisabled?: (selectedRows: any[]) => boolean // 批量删除禁用条件
  editDisabled?: (row: any) => boolean        // 单行编辑禁用条件（用于批量判断）
  deleteDisabled?: (row: any) => boolean      // 单行删除禁用条件（用于批量判断）
  selection?: boolean                         // 是否启用多选
}

export function useTableState(props: UseTableStateProps, emit: (event: string, ...args: any[]) => void) {
  // === 模式判断 ===
  /** 是否为 API 模式（通过 props.api 存在判断） */
  const isApiMode = computed(() => !!props.api)

  // === 数据状态 ===
  /** API 模式下的内部数据（本地数据模式使用 props.tableData） */
  const internalData = ref<any[]>([])
  /** 当前选中的行列表 */
  const selectedRows = ref<any[]>([])

  // === 批量操作禁用逻辑 ===
  /**
   * 判断批量操作是否禁用
   * 优先使用 batchDisabled 函数，其次检查每行的 rowDisabled
   * @param batchDisabled - 批量禁用条件函数
   * @param rowDisabled - 单行禁用条件函数
   * @param rows - 当前选中的行列表
   * @returns 是否禁用
   */
  const isBatchDisabled = (
    batchDisabled: ((rows: any[]) => boolean) | undefined,
    rowDisabled: ((row: any) => boolean) | undefined,
    rows: any[]
  ) => {
    // 优先使用批量禁用条件
    if (batchDisabled) {
      return batchDisabled(rows)
    }
    // 其次检查每行是否有禁用的
    if (rowDisabled) {
      return rows.some(rowDisabled)
    }
    return false
  }

  /** 批量编辑是否禁用 */
  const isBatchEditDisabled = computed(() =>
    isBatchDisabled(props.batchEditDisabled, props.editDisabled, selectedRows.value)
  )

  /** 批量删除是否禁用 */
  const isBatchDeleteDisabled = computed(() =>
    isBatchDisabled(props.batchDeleteDisabled, props.deleteDisabled, selectedRows.value)
  )

  // === 批量操作显示逻辑 ===
  /** 是否有自定义批量操作 */
  const hasBatchActions = computed(() => props.batchActions !== undefined && props.batchActions.length > 0)

  /** 可批量编辑的列（筛选出 batchEdit 为 true 的列） */
  const batchEditableColumns = computed(() =>
    (props.columns || []).filter((col) => col.batchEdit)
  )

  /**
   * 是否显示批量编辑
   * - 如果显式设置了 showBatchEdit，则使用该值
   * - 否则自动检测：当有可批量编辑的列时显示
   */
  const showBatchEdit = computed(() => {
    if (props.showBatchEdit !== undefined) {
      return props.showBatchEdit
    }
    return batchEditableColumns.value.length > 0
  })

  /**
   * 是否显示批量删除
   * - 如果显式设置了 showBatchDelete，则使用该值
   * - 否则自动检测：当 API 支持 batchDelete 时显示
   */
  const showBatchDelete = computed(() => {
    if (props.showBatchDelete !== undefined) {
      return props.showBatchDelete
    }
    return props.api?.batchDelete
  })

  /**
   * 是否显示批量操作菜单
   * 条件：启用多选 + 有批量操作/批量编辑/批量删除 + 有选中行
   */
  const showBatchActions = computed(() =>
    props.selection && (hasBatchActions.value || showBatchEdit.value || showBatchDelete.value) && selectedRows.value.length > 0
  )

  // === 搜索模式 ===
  /** 搜索模式：simple（简单搜索）| advanced（高级搜索） */
  const searchMode = ref<'simple' | 'advanced'>('simple')

  /** 自定义批量操作的禁用状态数组（与 props.batchActions 一一对应） */
  const batchActionDisabledStates = computed(() => {
    if (!props.batchActions) return []
    return props.batchActions.map((action) =>
      action.disabled ? action.disabled(selectedRows.value) : false
    )
  })

  // === 加载状态与分页（API 模式内部管理） ===
  /** API 模式下的加载状态 */
  const internalLoading = ref(false)
  /** API 模式下的总条数 */
  const internalTotal = ref(0)
  /** API 模式下的每页条数 */
  const internalPageSize = ref(props.pageSize || 15)
  /** API 模式下的当前页码 */
  const internalCurrentPage = ref(props.currentPage || 1)
  /** 表格尺寸 */
  const internalSize = ref<'' | 'default' | 'small' | 'large'>(props.size || 'default')

  // === 渲染适配（API 模式 / 本地数据模式统一接口） ===
  /** 渲染数据：API 模式使用 internalData，本地模式使用 props.tableData */
  const renderData = computed(() => (isApiMode.value ? internalData.value : props.tableData))
  /** 渲染总条数：API 模式使用 internalTotal，本地模式使用 props.total */
  const renderTotal = computed(() => (isApiMode.value ? internalTotal.value : props.total))
  /** 渲染加载状态：API 模式使用 internalLoading，本地模式使用 props.loadingState */
  const renderLoading = computed(() => (isApiMode.value ? internalLoading.value : props.loadingState || false))

  // === 分页器双向绑定 ===
  /**
   * 当前页双向绑定模型
   * - API 模式：内部维护状态
   * - 本地模式：同步到父组件
   */
  const currentPageModel = computed({
    get: () => (isApiMode.value ? internalCurrentPage.value : props.currentPage),
    set: (val) => {
      if (isApiMode.value) internalCurrentPage.value = val as number
      else emit('update:current-page', val)
    }
  })

  /**
   * 每页条数双向绑定模型
   * - API 模式：内部维护状态
   * - 本地模式：同步到父组件
   */
  const pageSizeModel = computed({
    get: () => (isApiMode.value ? internalPageSize.value : props.pageSize),
    set: (val) => {
      if (isApiMode.value) internalPageSize.value = val as number
      else emit('update:page-size', val)
    }
  })

  // === 事件处理 ===
  /**
   * 表格尺寸变化处理
   * @param size - 新的尺寸值
   */
  const handleSizeChange = (size: string) => {
    internalSize.value = size as '' | 'default' | 'small' | 'large'
    emit('update:size', internalSize.value)
  }

  /**
   * 选中行变化处理
   * @param selection - 当前选中的行列表
   */
  const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection
    emit('selection-change', selection)
  }

  /**
   * 重置分页参数
   * 将当前页重置为 1，每页条数重置为初始值
   */
  const resetPagination = () => {
    internalCurrentPage.value = 1
    internalPageSize.value = props.pageSize || 15
  }

  // === 返回值 ===
  return {
    isApiMode,                    // 是否为 API 模式
    internalData,                 // API 模式下的内部数据
    selectedRows,                 // 选中行列表
    isBatchEditDisabled,          // 批量编辑是否禁用
    isBatchDeleteDisabled,        // 批量删除是否禁用
    hasBatchActions,              // 是否有自定义批量操作
    showBatchEdit,                // 是否显示批量编辑
    showBatchDelete,              // 是否显示批量删除
    showBatchActions,             // 是否显示批量操作菜单
    searchMode,                   // 搜索模式
    batchActionDisabledStates,    // 自定义批量操作禁用状态数组
    internalLoading,              // API 模式下的加载状态
    internalTotal,                // API 模式下的总条数
    internalPageSize,             // API 模式下的每页条数
    internalCurrentPage,          // API 模式下的当前页码
    internalSize,                 // 表格尺寸
    renderData,                   // 渲染数据（模式适配）
    renderTotal,                  // 渲染总条数（模式适配）
    renderLoading,                // 渲染加载状态（模式适配）
    currentPageModel,             // 当前页双向绑定模型
    pageSizeModel,                // 每页条数双向绑定模型
    handleSizeChange,             // 尺寸变化处理
    handleSelectionChange,        // 选中变化处理
    resetPagination,              // 重置分页
    batchEditableColumns          // 可批量编辑的列
  }
}