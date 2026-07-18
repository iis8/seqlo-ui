/** 分页响应结构 */
export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 通用API响应结构 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}