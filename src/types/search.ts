// types/search.ts
import type { Field } from './field'

export interface SearchField extends Field {
  /** 是否在简单模式下隐藏（单参数搜索栏），默认显示 */
  hideInSimple?: boolean
  /** 值变化时是否自动触发搜索 */
  searchOnChange?: boolean
  defaultValue?: any
  /**
   * 值转换函数（用于日期范围等复合控件）
   * 接收控件返回的原始值，返回一个将被合并到查询参数中的对象
   * 例如：值 [startDate, endDate] → { startDate: '...', endDate: '...' }
   */
  transform?: (value: any) => Record<string, any>
  /** 在高级搜索模式下的栅格列数（24格） */
  colSpan?: number
}