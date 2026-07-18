import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { TableCrudApi } from '../../types/table'

/**
 * useRowActions Composable
 * 
 * 职责：管理表格行级操作功能，包括：
 * - 查看按钮点击处理（路由跳转）
 * - 编辑按钮点击处理（路由跳转）
 * - 删除按钮点击处理（API 调用或事件触发）
 * 
 * 设计思路：
 * - 使用 vue-router 进行路由跳转
 * - 支持路由路径中使用动态参数（如 /detail/:id），自动替换为行数据对应的值
 * - 支持函数式路由配置，可根据行数据动态生成路由
 * - 删除操作包含确认弹窗和成功提示
 */

/**
 * useRowActions 入参类型定义
 */
interface UseRowActionsProps {
  api?: TableCrudApi              // CRUD API 接口对象
  rowKey?: string                 // 行唯一标识字段（用于获取行 ID）
  viewRoute?: string | ((row: any) => string | { path: string; query?: Record<string, any> }) // 查看路由
  editRoute?: string | ((row: any) => string | { path: string; query?: Record<string, any> }) // 编辑路由
  confirmDelete?: boolean         // 删除是否需要确认弹窗
}

/** 解析后的路由类型 */
type ResolvedRoute = string | { path: string; query?: Record<string, any> }

/**
 * 替换路由路径中的动态参数
 * 将路径中的 :param 格式替换为行数据中对应字段的值
 * @param path - 路由路径（如 '/detail/:id'）
 * @param row - 行数据
 * @returns 替换参数后的路径
 */
const replacePathParams = (path: string, row: any) => path.replace(/:(\w+)/g, (_, key) => row[key] || '')

/**
 * 解析路由配置
 * 支持字符串和函数两种路由配置方式
 * @param route - 路由配置（字符串或函数）
 * @param row - 行数据
 * @returns 解析后的路由
 */
const resolveRoute = (route: string | ((row: any) => ResolvedRoute), row: any): ResolvedRoute => {
  const resolved = typeof route === 'function' ? route(row) : route
  if (typeof resolved === 'string') {
    // 如果是字符串，替换动态参数
    return replacePathParams(resolved, row)
  }
  // 如果是对象，替换 path 中的动态参数
  return { ...resolved, path: replacePathParams(resolved.path, row) }
}

export function useRowActions(props: UseRowActionsProps, emit: (event: string, ...args: any[]) => void) {
  /** vue-router 实例 */
  const router = useRouter()

  // === 查看操作 ===
  /**
   * 查看行处理
   * 根据 viewRoute 配置进行路由跳转，并触发 view-row-click 事件
   * @param row - 行数据
   */
  const handleViewRow = (row: any) => {
    if (props.viewRoute) {
      // 解析路由并跳转
      const resolvedRoute = resolveRoute(props.viewRoute, row)
      router.push(resolvedRoute)
    }
    // 触发 view-row-click 事件（无论是否配置了路由）
    emit('view-row-click', row)
  }

  // === 编辑操作 ===
  /**
   * 编辑行处理
   * 根据 editRoute 配置进行路由跳转，并触发 edit-row-click 事件
   * @param row - 行数据
   */
  const handleEditRow = (row: any) => {
    if (props.editRoute) {
      // 解析路由并跳转
      const resolvedRoute = resolveRoute(props.editRoute, row)
      router.push(resolvedRoute)
    }
    // 触发 edit-row-click 事件（无论是否配置了路由）
    emit('edit-row-click', row)
  }

  // === 删除操作 ===
  /**
   * 删除行处理
   * 包含确认弹窗，支持 API 模式和事件模式
   * @param row - 行数据
   * @param doLoad - 数据重新加载函数
   * @param setLoading - 加载状态设置函数
   */
  const handleDeleteRow = async (row: any, doLoad: () => Promise<void>, setLoading: (val: boolean) => void) => {
    // 获取行 ID
    const key = props.rowKey || 'id'
    const id = row[key]

    try {
      // 如果需要确认弹窗，弹出确认对话框
      if (props.confirmDelete !== false) {
        await ElMessageBox.confirm(
          '确认删除此记录？',
          '',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      }

      if (props.api?.delete) {
        // API 模式：调用删除接口
        setLoading(true)
        await props.api.delete(id)
        ElMessage.success('删除成功')
        // 删除成功后重新加载数据
        await doLoad()
      } else {
        // 事件模式：触发 delete-row-click 事件，由父组件处理
        emit('delete-row-click', row)
      }
    } catch {
      // 用户取消或关闭对话框，不做任何操作
    } finally {
      setLoading(false)
    }
  }

  // === 返回值 ===
  return {
    handleViewRow,           // 查看行处理
    handleEditRow,           // 编辑行处理
    handleDeleteRow          // 删除行处理
  }
}