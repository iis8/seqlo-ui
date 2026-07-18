import { ref, computed, watch, nextTick, type ComputedRef } from 'vue'
import type { Column, TableCrudApi } from '../../types/table'
import type { SearchField } from '../../types/search'

/**
 * useSearch Composable
 * 
 * 职责：管理表格的搜索功能，包括：
 * - 搜索参数管理
 * - 查询参数构建（包含分页、排序、搜索条件）
 * - 数据加载（API 调用）
 * - 排序状态管理
 * - 搜索/重置按钮处理
 * - 分页变化监听
 * 
 * 设计思路：
 * - 使用 ref 管理搜索参数和排序状态
 * - 通过 getQueryParams 构建完整的查询参数对象
 * - 监听分页和排序变化，自动触发数据加载
 * - 支持固定查询参数（不可编辑的条件）
 */

/**
 * useSearch 入参类型定义
 */
interface UseSearchProps {
  api?: TableCrudApi                          // CRUD API 接口对象
  columns?: Column[]                          // 列配置数组（用于排序校验）
  searchFields?: SearchField[]                // 搜索字段配置
  defaultQueryParams?: Record<string, any>    // 默认查询参数
  fixedQueryParams?: Record<string, any>      // 固定查询参数（不可编辑）
  defaultSort?: { prop: string; order: 'ascending' | 'descending' } // 默认排序
}

export function useSearch(
  props: UseSearchProps,
  emit: (event: string, ...args: any[]) => void,
  renderColumns: ComputedRef<Column[]>,        // 可见列配置（用于排序校验）
  internalCurrentPage: { value: number },       // 当前页码（来自 useTableState）
  internalPageSize: { value: number },          // 每页条数（来自 useTableState）
  internalData: { value: any[] },               // 数据存储（来自 useTableState）
  internalTotal: { value: number },             // 总条数（来自 useTableState）
  internalLoading: { value: boolean },          // 加载状态（来自 useTableState）
  refreshHintRef: { value: any }                // 刷新提示组件引用
) {
  // === 模式判断 ===
  /** 是否为 API 模式（通过 props.api 存在判断） */
  const isApiMode = computed(() => !!props.api)

  // === 搜索状态 ===
  /** 当前搜索参数（用户输入的搜索条件） */
  const searchParams = ref<Record<string, any>>({})

  /** 当前排序状态（prop: 排序列，order: 排序方向） */
  const sortState = ref<{ prop: string; order: 'ascending' | 'descending' | null }>({ prop: '', order: null })

  /** el-table 组件引用（用于调用 sort/clearSort 方法） */
  const mtable = ref<any>(null)

  // === 搜索字段处理 ===
  /**
   * 渲染用的搜索字段配置
   * 将 fixedQueryParams 中的字段标记为 disabled 和 hideInSimple
   * @returns 处理后的搜索字段配置数组
   */
  const renderSearchFields = computed(() => {
    if (!props.searchFields) return []
    // 获取固定参数的 key 列表
    const fixedKeys = props.fixedQueryParams ? Object.keys(props.fixedQueryParams) : []
    return props.searchFields.map((field) => {
      const isFixed = fixedKeys.includes(field.prop)
      if (!isFixed) return field
      // 固定参数：禁用编辑，且不在简单搜索模式下显示
      return {
        ...field,
        disabled: true,
        hideInSimple: true
      }
    })
  })

  // === 查询参数构建 ===
  /**
   * 获取完整的查询参数
   * 包含分页、搜索条件、固定参数和排序信息
   * @returns 查询参数字典
   */
  const getQueryParams = (): Record<string, any> => {
    const params: Record<string, any> = {
      pageNum: internalCurrentPage.value,       // 当前页码
      pageSize: internalPageSize.value,        // 每页条数
      ...searchParams.value,                   // 用户搜索条件
      ...props.fixedQueryParams                // 固定查询参数
    }

    // 添加排序参数
    const currentSort = resolveSort()
    if (currentSort) {
      if (currentSort.order === 'ascending') {
        params.asc = [currentSort.prop]        // 升序排序
      } else {
        params.desc = [currentSort.prop]       // 降序排序
      }
    }

    return params
  }

  /**
   * 解析当前排序状态
   * - 如果当前排序字段在可见列中，使用当前排序
   * - 否则检查默认排序是否在可见列中
   * @returns 排序配置（或 undefined）
   */
  const resolveSort = (): { prop: string; order: 'ascending' | 'descending' } | undefined => {
    const visibleProps = renderColumns.value.map((col) => col.prop)

    // 如果当前排序字段在可见列中，使用当前排序
    if (sortState.value.prop && sortState.value.order && visibleProps.includes(sortState.value.prop)) {
      return { prop: sortState.value.prop, order: sortState.value.order }
    }

    // 如果当前没有排序，但有默认排序且默认排序字段在可见列中，使用默认排序
    if (sortState.value.prop === '' && props.defaultSort && visibleProps.includes(props.defaultSort.prop)) {
      return props.defaultSort
    }

    return undefined
  }

  // === 数据加载 ===
  /**
   * 执行数据加载（API 模式）
   * 调用 api.search 获取数据，并更新 internalData 和 internalTotal
   */
  const doLoad = async () => {
    if (!isApiMode.value || !props.api) return

    internalLoading.value = true
    try {
      // 调用搜索 API
      const result = await props.api.search(getQueryParams())
      // 更新数据和总条数
      internalData.value = result.list
      internalTotal.value = result.total
      // 触发加载成功事件
      emit('load-success', result.list)
    } catch (e) {
      // 触发加载失败事件
      emit('load-error', e)
      // 清空数据
      internalData.value = []
    } finally {
      // 关闭加载状态
      internalLoading.value = false
      // 更新刷新时间
      refreshHintRef.value?.updateLastRefreshTime()
    }
  }

  // === 搜索操作 ===
  /**
   * 搜索按钮点击处理
   * 更新搜索参数并触发数据加载（API 模式）
   * @param query - 搜索条件
   */
  const handleSearch = async (query: Record<string, any>) => {
    if (isApiMode.value) {
      searchParams.value = query
      doLoad()
    }
    // 触发搜索事件（无论是否 API 模式）
    emit('search-click', query)
  }

  /**
   * 重置按钮点击处理
   * 清空搜索参数、排序状态，重置页码，并触发数据加载（API 模式）
   */
  const handleSearchReset = async () => {
    if (isApiMode.value) {
      // 清空搜索参数
      searchParams.value = {}
      // 清空排序状态
      sortState.value = { prop: '', order: null }
      // 同步表格排序状态
      syncTableSort()
      // 重置页码
      internalCurrentPage.value = 1
      // 重新加载数据
      doLoad()
    } else {
      // 触发重置事件（非 API 模式）
      emit('reset-click')
    }
  }

  // === 排序操作 ===
  /**
   * 排序变化处理
   * 更新排序状态并触发数据加载（API 模式）
   * @param sort - 排序信息
   */
  const handleSortChange = (sort: { prop: string; order: 'ascending' | 'descending' | null }) => {
    sortState.value = sort

    if (isApiMode.value) {
      // 排序变化时重置页码
      internalCurrentPage.value = 1
      doLoad()
    } else {
      // 触发排序事件（非 API 模式）
      emit('sort-change', sort)
    }
  }

  /**
   * 同步表格排序状态到 el-table
   * 在列变化或排序状态变化时调用，确保 el-table 的排序图标正确显示
   */
  const syncTableSort = () => {
    nextTick(() => {
      if (!mtable.value) return

      const currentSort = resolveSort()
      if (currentSort) {
        // 设置排序
        mtable.value.sort(currentSort.prop, currentSort.order)
      } else {
        // 清除排序
        mtable.value.clearSort()
      }
    })
  }

  /**
   * 协调排序状态
   * 当列配置变化时，检查当前排序字段是否仍在可见列中
   * @param columnPropSet - 当前列属性名集合
   */
  const reconcileSortState = (columnPropSet: Set<string>) => {
    if (sortState.value.prop && !columnPropSet.has(sortState.value.prop)) {
      // 当前排序字段已不存在，清空排序状态
      sortState.value = { prop: '', order: null }
      syncTableSort()
    }
  }

  // === 监听 ===
  /**
   * 监听可见列变化
   * 当可见列变化时，检查排序字段是否仍在可见列中
   */
  watch(renderColumns, (newColumns) => {
    const visibleProps = newColumns.map((col) => col.prop)
    if (sortState.value.prop && !visibleProps.includes(sortState.value.prop)) {
      // 当前排序字段已不可见，清空排序状态
      sortState.value = { prop: '', order: null }
      syncTableSort()
      // 如果是 API 模式，重新加载数据
      if (isApiMode.value) {
        doLoad()
      }
    }
  }, { deep: true })

  /**
   * 监听每页条数变化
   * 当每页条数变化时，重置页码并重新加载数据（API 模式）
   */
  watch(internalPageSize, (newVal) => {
    if (isApiMode.value) {
      internalCurrentPage.value = 1
      doLoad()
    }
  })

  /**
   * 监听当前页码变化
   * 当页码变化时，重新加载数据（API 模式）
   */
  watch(internalCurrentPage, (newVal) => {
    if (isApiMode.value) {
      doLoad()
    }
  })

  // === 初始化 ===
  /**
   * 初始化搜索
   * 设置默认查询参数并执行首次数据加载
   */
  const initSearch = () => {
    // 初始化搜索参数（使用默认值）
    searchParams.value = { ...props.defaultQueryParams }
    // 执行数据加载
    doLoad()
  }

  // === 返回值 ===
  return {
    searchParams,              // 当前搜索参数
    sortState,                 // 当前排序状态
    mtable,                    // el-table 组件引用
    renderSearchFields,        // 渲染用的搜索字段配置
    getQueryParams,            // 获取完整查询参数
    doLoad,                    // 执行数据加载
    handleSearch,              // 搜索按钮点击处理
    handleSearchReset,         // 重置按钮点击处理
    handleSortChange,          // 排序变化处理
    syncTableSort,             // 同步表格排序状态
    reconcileSortState,        // 协调排序状态
    initSearch                 // 初始化搜索
  }
}