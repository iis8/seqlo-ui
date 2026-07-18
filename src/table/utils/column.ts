import type { Column } from '../../types/table'
import type { Field } from '../../types/field'

/**
 * 列工具函数模块
 * 
 * 职责：提供表格列相关的工具函数
 * - getColumnBindProps: 获取列绑定到 el-table-column 的属性
 * - buildHeaderField: 构建表头字段配置（用于自定义表头组件）
 */

/**
 * 获取列绑定到 el-table-column 的属性
 * 
 * 过滤掉自定义属性（component、componentProps 等），只保留 el-table-column 支持的属性
 * @param col - 列配置对象
 * @returns 可直接绑定到 el-table-column 的属性对象
 */
export function getColumnBindProps(col: Column): Record<string, any> {
  // 解构出所有自定义属性（这些属性不直接传递给 el-table-column）
  const {
    component,              // 单元格渲染组件
    componentProps,         // 单元格组件属性
    componentListeners,     // 单元格组件事件监听
    options,                // 选项列表（用于下拉选择等）
    loadOptions,            // 异步加载选项的函数
    editComponent,          // 编辑模式下的组件
    editComponentProps,     // 编辑组件属性
    editComponentListeners, // 编辑组件事件监听
    formatter,              // 格式化函数
    render,                 // 自定义渲染函数
    updateOnChange,         // 是否在变化时立即更新
    headerComponent,        // 表头组件
    headerComponentProps,   // 表头组件属性
    headerSlot,             // 表头插槽名
    columnAttrs,            // 额外的列属性
    slot,                   // 单元格插槽名
    injectBaseProps,        // 是否注入基础属性
    editable,               // 是否可编辑
    ...elProps              // el-table-column 原生属性
  } = col

  // 返回合并后的属性：默认配置 + 原生属性 + 额外列属性
  return {
    showOverflowTooltip: true,  // 默认开启内容溢出提示
    ...elProps,                 // 展开 el-table-column 原生属性
    ...columnAttrs              // 展开额外列属性（优先级最高）
  }
}

/**
 * 构建表头字段配置
 * 
 * 将列配置转换为 Field 类型，用于渲染自定义表头组件
 * @param col - 列配置对象
 * @returns 表头字段配置
 */
export function buildHeaderField(col: Column): Field {
  // 初始化字段配置对象
  const field: Field = {
    prop: col.prop  // 字段属性名
  }

  // 如果配置了表头组件，添加到字段配置
  if (col.headerComponent) {
    field.component = col.headerComponent
  }

  // 如果配置了表头组件属性，添加到字段配置
  // 支持函数式属性（接收列配置作为参数）
  if (col.headerComponentProps) {
    field.componentProps = typeof col.headerComponentProps === 'function'
      ? col.headerComponentProps(col)  // 函数式：调用获取属性
      : col.headerComponentProps       // 非函数式：直接使用
  }

  return field
}