import type { Component, VNode } from 'vue';
import type { EditableFieldConfig, FieldEditorScope } from './field'
import type { PageResult, ApiResponse } from './api'
import type { FormItemRule } from 'element-plus'

export type Rules = Record<string, FormItemRule[]>

export interface Column<T = any> extends EditableFieldConfig<TableScope<T>> {
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: true | 'left' | 'right';
  sortable?: boolean;
  showOverflowTooltip?: boolean;
  columnAttrs?: Record<string, any>;
  slot?: boolean | string;
  headerComponent?: string | Component;
  headerComponentProps?: Record<string, any> | ((column: Column<T>) => Record<string, any>);
  headerSlot?: string;
  injectBaseProps?: boolean;

  // ---- 编辑相关 ----
  /** 是否可编辑，默认为 false */
  editable?: boolean;
  /** 是否允许批量编辑，默认为 false */
  batchEdit?: boolean;
}

export interface TableScope<T = any> extends FieldEditorScope {
  row: T;
  column: Column<T>;
  $index: number;
  store?: any;
  _self?: any;
}

export interface TableCrudApi<T = any> {
  /** 获取列表数据 */
  search: (params: any) => Promise<PageResult<T>>
  /** 创建新数据 */
  create?: (value: T) => Promise<ApiResponse<T>>
  /** 更新数据 */
  update?: (value: T) => Promise<ApiResponse<any>>
  updateByField?: (id: string, fieldName: string, value: any) => Promise<ApiResponse<any>>
  batchUpdateField?: (ids: string[], fieldName: string, value: any) => Promise<ApiResponse<any>>
  /** 获取单条数据 */
  getById?: (id: string) => Promise<ApiResponse<T>>
  /** 删除单条数据 */
  delete?: (id: string) => Promise<ApiResponse<any>>
  /** 批量删除数据 */
  batchDelete?: (ids: string[]) => Promise<ApiResponse<any>>
}

export interface BatchAction<T = any> {
  label: string
  /** 点击菜单项时执行的方法，接收选中的行数据数组 */
  action: (selectedRows: T[]) => void | Promise<void>
  /** 检查当前菜单项是否禁用，接收选中的行数据数组，返回布尔值 */
  disabled?: (selectedRows: T[]) => boolean
  divided?: boolean
  icon?: string | Component
}