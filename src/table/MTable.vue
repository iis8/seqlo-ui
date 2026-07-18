<template>
  <!-- MTable 主容器，包含工具栏、表格内容区、分页器和批量编辑弹窗 -->
  <!-- v-loading 绑定渲染加载状态，统一控制整个表格区域的加载遮罩 -->
  <div class="table-container scroll-container" v-loading="renderLoading">
    <!-- 工具栏区域：包含搜索栏和操作按钮 -->
    <div class="table-toolbar table-container__header">
      <div class="table-searchbar">
        <!-- 左侧操作区：批量操作、新增按钮等，仅在简单搜索模式下显示 -->
        <div v-if="searchMode === 'simple'" class="table-searchbar__left-actions">
          <!-- 左侧自定义操作插槽：允许父组件插入自定义按钮 -->
          <slot name="left-actions" />
          <!-- 批量操作下拉菜单：当有选中行且存在批量操作时显示 -->
          <el-dropdown v-if="showBatchActions" @command="handleBatchCommand" class="batch-dropdown">
            <el-button type="primary" plain>
              {{ t('mtable.batchOperation', { count: selectedRows.length }) }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <!-- 自定义批量操作项：通过 props.batchActions 配置 -->
                <el-dropdown-item v-for="(action, index) in props.batchActions"
                  :key="index" :command="index"
                  :disabled="batchActionDisabledStates[index]"
                  :divided="action.divided"
                  :icon="action.icon"
                >
                  {{ action.label }}
                </el-dropdown-item>
                <!-- 批量编辑选项：仅当配置了可批量编辑列时显示 -->
                <el-dropdown-item v-if="showBatchEdit"
                  key="batch-edit"
                  command="batch-edit"
                  icon="Edit"
                  :divided="hasBatchActions"
                  :disabled="!props.editable || isBatchEditDisabled"
                >
                  {{ t('mtable.batchEdit') }}
                </el-dropdown-item>
                <!-- 批量删除选项：仅当 API 支持批量删除时显示 -->
                <el-dropdown-item v-if="showBatchDelete"
                  key="batch-delete"
                  command="batch-delete"
                  icon="Delete"
                  :divided="hasBatchActions || showBatchEdit"
                  :disabled="!props.editable || isBatchDeleteDisabled"
                >
                  {{ t('mtable.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- 新增按钮：可通过 addButton prop 控制显示 -->
          <el-button v-if="addButton" type="primary" icon="Plus" @click="handleAdd">{{ t('mtable.add') }}</el-button>
          <!-- 左侧操作区右侧插槽：在新增按钮之后插入自定义内容 -->
          <slot name="left-actions-right" />
        </div>
        <!-- 搜索栏内容区：包含搜索表单，简单模式和高级模式共用 -->
        <div class="table-searchbar__content">
          <search-bar v-if="renderSearchFields.length > 0"
            :fields="renderSearchFields"
            :custom-components="customComponents"
            :model-value="props.defaultQueryParams"
            @mode-change="(mode) => searchMode = mode"
            @search="handleSearch"
            @reset="handleSearchReset"
          />
        </div>
        <!-- 右侧操作区：表格尺寸、列选择等功能，仅在简单搜索模式下显示 -->
        <div v-if="searchMode === 'simple'" class="table-searchbar__right-actions">
          <!-- 右侧自定义操作插槽：允许父组件插入自定义按钮 -->
          <slot name="right-actions" />
          <!-- 表格尺寸切换：支持 large/default/small 三种尺寸 -->
          <el-dropdown class="size-dropdown" @command="handleSizeChange">
            <span class="right-action-icon" :title="t('mtable.tableSize')">
              <el-icon><Finished /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="'large'" :disabled="internalSize === 'large'">
                  <el-icon><ZoomIn /></el-icon>
                  <span>{{ t('mtable.sizeLarge') }}</span>
                </el-dropdown-item>
                <el-dropdown-item :command="'default'" :disabled="internalSize === '' || internalSize === 'default'">
                  <el-icon><Finished /></el-icon>
                  <span>{{ t('mtable.sizeDefault') }}</span>
                </el-dropdown-item>
                <el-dropdown-item :command="'small'" :disabled="internalSize === 'small'">
                  <el-icon><ZoomOut /></el-icon>
                  <span>{{ t('mtable.sizeSmall') }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- 列选择器：支持列显示/隐藏切换和拖拽排序，至少两列时显示 -->
          <el-dropdown v-if="props.columns && props.columns.length > 1" class="column-dropdown" popper-class="column-dropdown-popper" @visible-change="handleDropdownVisibleChange">
            <span class="right-action-icon" :title="t('mtable.columnSelect')">
              <el-icon><View /></el-icon>
            </span>
            <template #dropdown>
              <div class="column-dropdown-menu">
                <!-- 列选择器头部：全选/反选按钮和重置按钮 -->
                <div class="column-dropdown-header">
                  <el-checkbox
                    :model-value="isAllColumnSelected"
                    :indeterminate="isColumnSelectionIndeterminate"
                    size="small"
                    @change="handleSelectAllColumn"
                  >
                    {{ t('mtable.all') }}
                  </el-checkbox>
                  <div class="column-dropdown-header-right">
                    <span class="column-dropdown-count">{{ columnSettings.filter(col => col.visible).length }}/{{ columnSettings.length }}</span>
                    <el-button size="small" text @click.stop="handleResetColumns">{{ t('mtable.reset') }}</el-button>
                  </div>
                </div>
                <div class="column-dropdown-divider"></div>
                <!-- 列选择器列表：支持拖拽排序，每项可单独切换显示/隐藏 -->
                <div ref="columnDropdownListRef" class="column-dropdown-list">
                  <div
                  v-for="setting in columnSettings"
                  :key="setting.prop"
                  class="column-dropdown-item"
                  :class="{ 'disabled': setting.prop !== ACTION_COLUMN_PROP && columnSettings.filter(col => col.visible && col.prop !== ACTION_COLUMN_PROP).length <= props.minColumnCount && setting.visible }"
                >
                  <span class="column-drag-handle">⋮</span>
                  <el-checkbox
                    :model-value="setting.visible"
                    :disabled="setting.prop !== ACTION_COLUMN_PROP && columnSettings.filter(col => col.visible && col.prop !== ACTION_COLUMN_PROP).length <= props.minColumnCount && setting.visible"
                    size="small"
                    @change="(val: any) => handleColumnToggle(setting.prop, val)"
                  >
                      {{ setting.prop === ACTION_COLUMN_PROP ? t('mtable.action') : props.columns?.find(c => c.prop === setting.prop)?.label || setting.prop }}
                    </el-checkbox>
                  </div>
                </div>
              </div>
            </template>
          </el-dropdown>
          <!-- 右侧操作区右侧插槽：在列选择器之后插入自定义内容 -->
          <slot name="right-actions-right" />
        </div>
        </div>
    </div>
    <!-- 表格内容区：包含 el-table 组件 -->
    <div class="scroll-container__content">
      <!-- el-table 主组件：绑定数据、样式和事件 -->
      <!-- v-bind="$attrs" 和 v-on="$attrs" 透传未声明的属性和事件给 el-table -->
      <el-table
        ref="mtable"
        :height="height"
        :row-key="rowKey"
        :data="renderData"
        :border="border"
        :stripe="stripe"
        :size="internalSize"
        v-bind="$attrs"
        v-on="$attrs"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <!-- 选择列：当 selection prop 为 true 时显示，用于多选 -->
        <el-table-column v-if="selection" type="selection" width="40" align="center" />

        <!-- 数据列渲染：遍历可见列配置，动态生成表格列 -->
        <template v-for="column in renderColumns" :key="column.prop">
          <el-table-column v-bind="getColumnBindProps(column)"
             :sortable="column.sortable === false ? false : 'custom'"
          >
            <!-- 表头渲染：优先使用自定义插槽，其次使用自定义组件 -->
            <template v-if="column.headerSlot" #header>
              <!-- 表头自定义插槽 -->
              <slot :name="column.headerSlot" :column="column" />
            </template>
            <template v-else-if="column.headerComponent" #header>
              <!-- 表头自定义组件渲染 -->
              <FieldRenderer
                :field="buildHeaderField(column)"
                :custom-components="props.customComponents"
              />
            </template>

            <!-- 单元格渲染：使用 FieldEditor 组件，支持内联编辑 -->
            <template #default="scope">
              <FieldEditor
                :model-value="get(scope.row, column.prop)"
                :field="column"
                :editable="props.editable && column.editable"
                :custom-components="props.customComponents"
                :row="scope.row"
                :index="scope.$index"
                :show-overflow-tooltip="column.showOverflowTooltip"
                @change="(val: any) => handleEditChange(scope.row, column, val)"
              >
                <!-- 单元格自定义插槽：优先使用插槽渲染 -->
                <template v-if="column.slot" #default>
                  <slot
                    :name="column.slot === true ? column.prop : column.slot"
                    :row="scope.row"
                    :column="column"
                    :index="scope.$index"
                    :scope="scope"
                  />
                </template>
              </FieldEditor>
            </template>
          </el-table-column>
        </template>

        <!-- 操作列：固定在右侧，包含查看、编辑、删除按钮 -->
        <el-table-column v-if="actionColumn && isActionColumnVisible" :min-width="200" :align="'center'" :fixed="'right'" :show-overflow-tooltip="false" v-bind="actionColumnProps">
          <template #default="scope">
            <!-- 操作列左侧插槽：在系统按钮之前插入自定义内容 -->
            <slot name="left-actionColumn" :row="scope.row" :index="scope.$index" :scope="scope" />
            <!-- 查看按钮：通过 viewRoute 配置跳转路由 -->
            <el-button v-if="props.showView" type="primary" link icon="View" @click="handleViewRow(scope.row)" :disabled="props.viewDisabled?.(scope.row)">{{ t('mtable.view') }}</el-button>
            <!-- 编辑按钮：API 模式下且配置了 formConfig 时打开表单对话框，否则跳转到编辑路由 -->
            <el-button v-if="props.showEdit" type="primary" link icon="Edit" @click="handleEdit(scope.row, scope.$index)" :disabled="!props.editable || props.editDisabled?.(scope.row)">{{ t('mtable.edit') }}</el-button>
            <!-- 删除按钮：调用 handleDeleteRowWrapper，受 editable 和 deleteDisabled 控制 -->
            <el-button v-if="props.showDelete" type="danger" link icon="Delete" @click="handleDeleteRowWrapper(scope.row)" :disabled="!props.editable || props.deleteDisabled?.(scope.row)">{{ t('mtable.delete') }}</el-button>
            <!-- 操作列右侧插槽：在系统按钮之后插入自定义内容 -->
            <slot name="actionColumn" :row="scope.row" :index="scope.$index" :scope="scope" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 底部区域：包含刷新提示和分页器 -->
    <div class="pagination-container scroll-container__footer">
      <!-- 刷新提示组件：显示最后刷新时间，支持手动刷新 -->
      <RefreshHint
        v-if="props.showRefreshHint"
        ref="refreshHintRef"
        :interval="props.refreshHintInterval"
        @refresh="doLoad"
      />
      <!-- 分页器：支持页码切换和每页条数选择 -->
      <el-pagination
        v-model:page-size="pageSizeModel"
        v-model:current-page="currentPageModel"
        :total="renderTotal"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
      />
    </div>

    <!-- 批量编辑对话框：用于对选中行进行字段批量修改 -->
    <el-dialog
      v-model="batchEditDialogVisible"
      :title="t('mtable.batchEdit')"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-width="100px">
        <el-form-item :label="t('mtable.batchEditField')">
          <el-select
            v-model="batchEditField"
            :placeholder="t('mtable.batchEditFieldPlaceholder')"
            @change="handleBatchEditFieldChange"
          >
            <el-option
              v-for="col in batchEditableColumns"
              :key="col.prop"
              :label="col.label"
              :value="col"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchEditField" :label="t('mtable.batchEditValue')">
          <FieldRenderer
            :field="batchEditFieldConfig"
            :model-value="batchEditValue"
            :custom-components="props.customComponents"
            @change="(val: any) => batchEditValue = val"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="internalLoading" @click="handleBatchEditConfirmWrapper">
                {{ t('common.confirm') }}
              </el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑表单对话框 -->
    <TableFormDialog
      v-if="isApiMode && formConfig"
      ref="formDialogRef"
      :config="formConfig"
      :api="api"
      :row-key="rowKey"
      :width="formDialogWidth"
      :title-add="formTitleAdd"
      :title-edit="formTitleEdit"
      :custom-components="customComponents"
      :sync-detail-on-edit="syncDetailOnEdit"
      :version-field="versionField"
      :rules="rules"
      @success="handleFormSuccess"
      @sync-detail="handleSyncDetail"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * MTable 组件 - 增强型表格组件
 * 
 * 功能概述：
 * - 支持 API 模式和本地数据模式
 * - 支持列显示/隐藏切换和拖拽排序
 * - 支持批量操作（批量编辑、批量删除）
 * - 支持行级操作（查看、编辑、删除）
 * - 支持内联编辑
 * - 支持搜索功能（简单模式/高级模式）
 * - 支持分页和排序
 * - 支持表格尺寸调整
 * - 支持用户配置持久化（localStorage）
 * 
 * 组件拆分：
 * - useTableState.ts: 表格核心状态管理
 * - useColumnSettings.ts: 列配置管理
 * - useBatchActions.ts: 批量操作管理
 * - useRowActions.ts: 行操作管理
 * - useSearch.ts: 搜索功能管理
 * - useCellEdit.ts: 单元格编辑管理
 * - utils/column.ts: 列工具函数
 */
// 类型导入
import type { Component } from 'vue'
import type { Column, TableCrudApi, BatchAction, Rules } from '../types/table'
import type { SearchField } from '../types/search'
import type { FormConfig } from '../types/form'

// 组合式函数导入
import { useStorageConfig } from '../composables/useStorageConfig'

// 组件导入
import SearchBar from '../SearchBar.vue'           // 搜索栏组件
import FieldRenderer from '../FieldRenderer.vue'     // 字段渲染器（用于表头和表单）
import FieldEditor from '../FieldEditor.vue'         // 字段编辑器（支持内联编辑）
import RefreshHint from './RefreshHint.vue'          // 刷新提示组件
import TableFormDialog from './TableFormDialog.vue'   // 表单对话框组件（新增/编辑）

// 工具函数导入
import { get } from 'lodash-es'                     // lodash 取值函数
import { ref, onMounted, nextTick } from 'vue'       // Vue 3 响应式 API
import { useI18n } from 'vue-i18n'                  // 国际化

// 样式导入
import '../style.scss'

// Composable 导入 - 表格核心功能拆分
import { useTableState } from './composables/useTableState'         // 表格状态管理
import { useColumnSettings, ACTION_COLUMN_PROP } from './composables/useColumnSettings' // 列配置管理
import { useBatchActions } from './composables/useBatchActions'     // 批量操作管理
import { useRowActions } from './composables/useRowActions'         // 行操作管理
import { useSearch } from './composables/useSearch'                 // 搜索功能管理
import { useCellEdit } from './composables/useCellEdit'             // 单元格编辑管理
import { tryInitFromComponent } from '../composables/useAutoInit'    // 自动初始化 i18n
import { getColumnBindProps, buildHeaderField } from './utils/column' // 列工具函数

const i18n = useI18n()
tryInitFromComponent(i18n)

const { t } = i18n

defineOptions({
  name: 'MTable',
})

// 事件定义
const emit = defineEmits<{
  'update:page-size': [value: number]                                    // 每页条数变化
  'update:current-page': [value: number]                                // 当前页码变化
  'add-click': []                                                       // 点击新增按钮
  'search-click': [query: Record<string, any>]                          // 搜索按钮点击
  'reset-click': []                                                     // 重置按钮点击
  'selection-change': [selection: any[]]                                // 选中行变化
  'update:size': [value: string]                                        // 表格尺寸变化
  'load-success': [data: any[]]                                         // 数据加载成功
  'load-error': [error: any]                                            // 数据加载失败
  'cell-change': [payload: { row: any; col: Column; value: any }]       // 单元格编辑完成
  'batch-edit': [payload: { rows: any[]; ids: any[]; field: string; value: any }] // 批量编辑
  'batch-delete': [rows: any[]]                                         // 批量删除确认
  'view-row-click': [row: any]                                          // 点击查看按钮
  'edit-row-click': [row: any]                                          // 点击编辑按钮
  'delete-row-click': [row: any]                                        // 点击删除按钮（非 API 模式）
  'sort-change': [sort: { prop: string; order: 'ascending' | 'descending' | null }] // 排序变化
}>()

// emit 类型转换：用于传递给 composables（composables 不关心具体事件类型）
const emitAny = emit as (event: string, ...args: any[]) => void

// Props 定义 - 表格配置项
const props = withDefaults(
  defineProps<{
    // === 数据配置 ===
    columns?: Column[],                    // 列配置数组
    tableData?: any[],                     // 本地数据模式下的数据（API 模式不需要）
    total?: number,                        // 本地数据模式下的总条数（API 模式不需要）
    pageSize?: number,                     // 每页条数
    currentPage?: number,                  // 当前页码
    api?: TableCrudApi,                    // CRUD API 接口对象（API 模式必须）

    // === 样式配置 ===
    height?: string | number,              // 表格高度
    border?: boolean,                      // 是否显示边框
    stripe?: boolean,                      // 是否显示斑马纹
    size?: '' | 'default' | 'small' | 'large', // 表格尺寸

    // === 分页配置 ===
    paginationLayout?: string,             // 分页器布局
    pageSizes?: number[],                  // 每页条数选项

    // === 选择配置 ===
    selection?: boolean,                   // 是否显示多选列
    rowKey?: string,                       // 行唯一标识字段

    // === 批量操作配置 ===
    batchActions?: BatchAction[],          // 自定义批量操作
    showBatchEdit?: boolean,               // 是否显示批量编辑（自动检测）
    showBatchDelete?: boolean,             // 是否显示批量删除（自动检测）
    batchEditDisabled?: (selectedRows: any[]) => boolean, // 批量编辑禁用条件
    batchDeleteDisabled?: (selectedRows: any[]) => boolean, // 批量删除禁用条件

    // === 操作按钮配置 ===
    addButton?: boolean,                   // 是否显示新增按钮
    editable?: boolean,                    // 是否可编辑（控制编辑/删除按钮启用状态）
    showView?: boolean,                    // 是否显示查看按钮
    viewRoute?: string | ((row: any) => string | { path: string; query?: Record<string, any> }), // 查看路由
    viewDisabled?: (row: any) => boolean,  // 查看按钮禁用条件
    showEdit?: boolean,                    // 是否显示编辑按钮
    editRoute?: string | ((row: any) => string | { path: string; query?: Record<string, any> }), // 编辑路由
    editDisabled?: (row: any) => boolean,  // 编辑按钮禁用条件
    showDelete?: boolean,                  // 是否显示删除按钮
    deleteDisabled?: (row: any) => boolean, // 删除按钮禁用条件
    confirmDelete?: boolean,               // 删除是否需要确认弹窗

    // === 操作列配置 ===
    showActionColumn?: boolean,            // 是否显示操作列（自动检测）
    actionColumnProps?: Record<string, any>, // 操作列额外属性

    // === 搜索配置 ===
    searchFields?: SearchField[],          // 搜索字段配置
    defaultQueryParams?: Record<string, any>, // 默认查询参数
    fixedQueryParams?: Record<string, any>,   // 固定查询参数（不可编辑）

    // === 列配置 ===
    minColumnCount?: number,               // 最少可见列数（防止全部隐藏）

    // === 持久化配置 ===
    storeConfigKey?: string,               // 本地存储键名

    // === 刷新提示配置 ===
    showRefreshHint?: boolean,             // 是否显示刷新提示
    refreshHintInterval?: number,          // 刷新提示间隔（分钟）

    // === 排序配置 ===
    defaultSort?: { prop: string; order: 'ascending' | 'descending' }, // 默认排序

    // === 自定义组件 ===
    customComponents?: Record<string, Component>, // 自定义字段组件映射
    loadingState?: boolean,                // 本地数据模式下的加载状态

    // === 表单对话框配置 ===
    formConfig?: FormConfig,               // 新增/编辑表单配置
    formDialogWidth?: string | number,     // 表单对话框宽度
    formTitleAdd?: string,                 // 新增表单标题
    formTitleEdit?: string,                // 编辑表单标题
    syncDetailOnEdit?: boolean,            // 编辑时是否从后台同步详情数据
    versionField?: string,                 // 版本字段名，用于检测数据更新
    rules?: Rules,                         // 表单验证规则（用于新增、编辑、单元格更新、批量编辑）
  }>(),
  {
    columns: () => [],
    tableData: () => [],
    selection: false,
    batchActions: () => [],
    height: '100%',
    border: true,
    stripe: true,
    size: 'default',
    pageSize: 15,
    currentPage: 1,
    total: 0,
    paginationLayout: 'total, sizes, prev, pager, next, jumper',
    pageSizes: () => [10, 15, 20, 50],
    rowKey: 'id',
    customComponents: () => ({}),
    addButton: true,
    editable: true,
    minColumnCount: 1,
    storeConfigKey: 'MTable',
    showView: false,
    showEdit: false,
    showDelete: false,
    showBatchEdit: undefined as boolean | undefined,
    showBatchDelete: undefined as boolean | undefined,
    confirmDelete: true,
    showActionColumn: false,
    actionColumnProps: () => ({}),
    showRefreshHint: true,
    refreshHintInterval: 5,
    syncDetailOnEdit: true,
    formDialogWidth: '800px',
    versionField: 'version',
    rules: () => ({}),
  },
)

// 组件引用
const refreshHintRef = ref<InstanceType<typeof RefreshHint> | null>(null)
const formDialogRef = ref<InstanceType<typeof TableFormDialog> | null>(null)

// ==================== Composable 调用 ====================

// 1. useTableState - 表格状态管理
// 职责：管理表格核心状态（数据、分页、选中、加载状态等）
const {
  isApiMode,                               // 是否为 API 模式
  internalData,                             // API 模式下的内部数据
  selectedRows,                             // 选中行列表
  isBatchEditDisabled,                      // 批量编辑是否禁用
  isBatchDeleteDisabled,                    // 批量删除是否禁用
  hasBatchActions,                          // 是否有自定义批量操作
  showBatchEdit,                            // 是否显示批量编辑
  showBatchDelete,                          // 是否显示批量删除
  showBatchActions,                         // 是否显示批量操作菜单
  searchMode,                               // 搜索模式（simple/advanced）
  batchActionDisabledStates,                // 自定义批量操作禁用状态数组
  internalLoading,                          // API 模式下的加载状态
  internalTotal,                            // API 模式下的总条数
  internalPageSize,                         // API 模式下的每页条数
  internalCurrentPage,                      // API 模式下的当前页码
  internalSize,                             // 表格尺寸
  renderData,                               // 渲染数据（API/本地模式适配）
  renderTotal,                              // 渲染总条数（API/本地模式适配）
  renderLoading,                            // 渲染加载状态（API/本地模式适配）
  currentPageModel,                         // 分页器双向绑定：当前页
  pageSizeModel,                            // 分页器双向绑定：每页条数
  handleSizeChange,                         // 尺寸变化处理
  handleSelectionChange,                    // 选中变化处理
  batchEditableColumns                      // 可批量编辑的列
} = useTableState(props, emitAny)

// 2. useColumnSettings - 列配置管理
// 职责：管理列的显示/隐藏状态、列选择器、拖拽排序
const { 
  actionColumn,                              // 是否显示操作列
  columnSettings,                            // 列配置列表（包含显示/隐藏状态）
  columnDropdownListRef,                     // 列选择器列表引用（用于拖拽排序）
  isAllColumnSelected,                       // 是否全选列
  isColumnSelectionIndeterminate,            // 列选择是否为半选状态
  isActionColumnVisible,                     // 操作列是否可见
  renderColumns,                             // 渲染用的列配置（仅可见列）
  handleSelectAllColumn,                     // 全选/反选列处理
  handleColumnToggle,                        // 单个列显示/隐藏切换
  handleResetColumns,                        // 重置列配置
  handleDropdownVisibleChange,               // 列选择器显示/隐藏变化处理
  reconcileColumnSettings                    // 列配置协调（当 columns 变化时）
} = useColumnSettings(props)

// 3. useSearch - 搜索功能管理
// 职责：管理搜索参数、查询参数构建、数据加载、排序逻辑
const {
  mtable,                                    // el-table 组件引用
  renderSearchFields,                        // 渲染用的搜索字段配置
  getQueryParams,                            // 获取当前查询参数
  doLoad,                                    // 执行数据加载
  handleSearch,                              // 搜索按钮点击处理
  handleSearchReset,                         // 重置按钮点击处理
  handleSortChange,                          // 排序变化处理
  syncTableSort,                             // 同步表格排序状态
  reconcileSortState,                        // 排序状态协调（当列变化时）
  initSearch                                 // 初始化搜索（组件挂载时调用）
} = useSearch(
  {
    api: props.api,
    columns: props.columns,
    searchFields: props.searchFields,
    defaultQueryParams: props.defaultQueryParams,
    fixedQueryParams: props.fixedQueryParams,
    defaultSort: props.defaultSort
  },
  emitAny,
  renderColumns,
  internalCurrentPage,
  internalPageSize,
  internalData,
  internalTotal,
  internalLoading,
  refreshHintRef
)

// 4. useBatchActions - 批量操作管理
// 职责：管理批量编辑对话框、批量删除逻辑
const {
  batchEditDialogVisible,                    // 批量编辑对话框可见性
  batchEditField,                            // 批量编辑选中的字段
  batchEditValue,                            // 批量编辑的值
  batchEditFieldConfig,                      // 批量编辑字段配置（用于 FieldRenderer）
  openBatchEditDialog,                       // 打开批量编辑对话框
  handleBatchEditFieldChange,                // 批量编辑字段变化处理
  handleBatchEditConfirm,                    // 批量编辑确认处理
  handleBatchDelete                          // 批量删除处理
} = useBatchActions({
  api: props.api,
  rowKey: props.rowKey,
  batchEditableColumns: batchEditableColumns.value,
  selectedRows: selectedRows.value,
  confirmDelete: props.confirmDelete,
  rules: props.rules
}, emitAny)

// 5. useRowActions - 行操作管理
// 职责：管理行级操作（查看、编辑、删除按钮）及路由跳转
const {
  handleViewRow,                             // 查看行处理（路由跳转）
  handleEditRow,                             // 编辑行处理（路由跳转）
  handleDeleteRow                            // 删除行处理（API 调用或事件触发）
} = useRowActions({
  api: props.api,
  rowKey: props.rowKey,
  viewRoute: props.viewRoute,
  editRoute: props.editRoute,
  confirmDelete: props.confirmDelete
}, emitAny)

// 6. useCellEdit - 单元格编辑管理
// 职责：管理内联编辑完成后的回调处理
const {
  handleEditChange                           // 单元格编辑完成处理
} = useCellEdit({ api: props.api, rules: props.rules }, emitAny, internalLoading)

// ==================== 配置持久化 ====================
// 使用 localStorage 持久化用户配置：每页条数、表格尺寸、列配置
useStorageConfig(
  { internalPageSize, internalSize, columnSettings },
  {
    componentId: props.storeConfigKey,
    fields: ['internalPageSize', 'internalSize', 'columnSettings']
  }
)

// ==================== 组件暴露方法 ====================
// 供父组件调用的公共方法
defineExpose({
  doLoad,                                    // 重新加载数据
  getQueryParams,                            // 获取当前查询参数
  refreshHintRef: () => refreshHintRef.value?.updateLastRefreshTime(), // 手动更新刷新时间
  openFormDialog: (mode: 'add' | 'edit', row?: Record<string, any>, index?: number) => {
    formDialogRef.value?.open(mode, row, index)
  }
})

// ==================== 事件处理方法 ====================

/**
 * 新增按钮点击处理
 * API 模式下且配置了 formConfig 时，打开表单对话框
 * 否则触发 add-click 事件，由父组件处理具体的新增逻辑
 */
async function handleAdd() {
  if (isApiMode.value && props.formConfig && formDialogRef.value) {
    formDialogRef.value.open('add')
  } else emit('add-click')
}

/**
 * 编辑按钮点击处理
 * API 模式下且配置了 formConfig 时，打开表单对话框
 * 否则调用 handleEditRow 跳转到编辑路由
 * @param row - 行数据
 * @param index - 行索引
 */
function handleEdit(row: any, index?: number) {
  if (isApiMode.value && props.formConfig && formDialogRef.value) {
    formDialogRef.value.open('edit', row, index)
    return
  }
  handleEditRow(row)
}

/**
 * 表单提交成功处理
 * edit 模式下使用 index 更新单行数据，add 模式下重新加载表格
 * @param mode - 操作模式：add 或 edit
 * @param data - 提交的数据
 * @param index - 行索引（edit 模式下使用）
 */
async function handleFormSuccess(mode: 'add' | 'edit', data: Record<string, any>, index: number) {
  if (mode === 'edit' && index >= 0 && index < internalData.value.length) {
    const key = props.rowKey || 'id'
    internalData.value[index] = { ...internalData.value[index], ...data }
  } else {
    await doLoad()
  }
}

/**
 * 同步详情数据处理
 * 打开编辑对话框，如果开启了同步模式
 * 更新表格中对应行的数据为最新值
 * @param row - 同步回来的完整行数据
 * @param index - 行索引（优先使用，避免 findIndex 查找）
 */
function handleSyncDetail(row: Record<string, any>, index: number) {
  if (index >= 0 && index < internalData.value.length) {
    internalData.value[index] = { ...internalData.value[index], ...row }
  } else {
    const key = props.rowKey || 'id'
    const id = row[key]
    if (id !== undefined) {
      const findIndex = internalData.value.findIndex(item => item[key] === id)
      if (findIndex !== -1) {
        internalData.value[findIndex] = { ...internalData.value[findIndex], ...row }
      }
    }
  }
}

/**
 * 删除行包装方法
 * 封装 handleDeleteRow，传递 doLoad 和 loading 状态更新函数
 * @param row - 要删除的行数据
 */
const handleDeleteRowWrapper = (row: any) => {
  handleDeleteRow(row, doLoad, (val: boolean) => { internalLoading.value = val })
}

/**
 * 批量编辑确认包装方法
 * 封装 handleBatchEditConfirm，传递 doLoad 和 loading 状态更新函数
 */
const handleBatchEditConfirmWrapper = () => {
  handleBatchEditConfirm(doLoad, (val: boolean) => { internalLoading.value = val })
}

/**
 * 批量操作命令处理
 * 根据命令类型执行对应的批量操作
 * @param command - 命令类型：批量操作索引 | 'batch-edit' | 'batch-delete'
 */
async function handleBatchCommand(command: number | string) {
  if (command === 'batch-edit') {
    // 打开批量编辑对话框
    openBatchEditDialog()
    return
  }
  if (command === 'batch-delete') {
    // 执行批量删除
    await handleBatchDelete(doLoad, (val) => { internalLoading.value = val })
    return
  }
  // 执行自定义批量操作
  const action = typeof command === 'number' ? props.batchActions?.[command] : undefined
  if (action) {
    try {
      await action.action(selectedRows.value)
    } catch (error) {
      console.error('批量操作执行失败:', error)
    }
  }
}

// ==================== 生命周期钩子 ====================

/**
 * 组件挂载完成
 * 初始化列配置、排序状态，并在 API 模式下执行首次数据加载
 */
onMounted(async () => {
  // 等待 DOM 更新完成
  await nextTick()

  // 协调列配置（确保列设置与当前 columns 匹配）
  reconcileColumnSettings()
  // 协调排序状态（确保排序列在可见列中）
  reconcileSortState(new Set(props.columns?.map(c => c.prop) || []))
  // 同步表格排序状态到 el-table
  syncTableSort()

  // API 模式下执行首次数据加载
  if (isApiMode.value) {
    initSearch()
  }
})
</script>