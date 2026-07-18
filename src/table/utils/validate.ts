import { ElMessage } from 'element-plus'
import type { FormItemRule } from 'element-plus'
import { tryGetI18n } from '../../composables/_context'

// 通过依赖注入获取 i18n；若宿主未配置则降级为直接返回 key（避免运行时崩溃）
function t(key: string, params?: Record<string, any>): string {
  const i18n = tryGetI18n()
  if (i18n) return i18n.t(key, params)
  // 简单兜底：返回 key，便于未初始化时也能定位问题
  return key
}

export function getMessage(defaultMsg: string, message?: string | ((a?: string | undefined) => string)): string {
  if (typeof message === 'function') {
    return message()
  }
  return message || defaultMsg
}

export async function validateField(rules: FormItemRule[] | undefined, value: any, prop: string): Promise<boolean> {
  if (!rules || rules.length === 0) return true

  for (const rule of rules) {
    if (rule.required && (value === undefined || value === null || value === '')) {
      ElMessage.error(getMessage(t('mtable.validation.required', { field: prop }), rule.message))
      return false
    }

    if (rule.min !== undefined && typeof value === 'string' && value.length < rule.min) {
      ElMessage.error(getMessage(t('mtable.validation.stringMin', { field: prop, min: rule.min }), rule.message))
      return false
    }

    if (rule.max !== undefined && typeof value === 'string' && value.length > rule.max) {
      ElMessage.error(getMessage(t('mtable.validation.stringMax', { field: prop, max: rule.max }), rule.message))
      return false
    }

    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      ElMessage.error(getMessage(t('mtable.validation.numberMin', { field: prop, min: rule.min }), rule.message))
      return false
    }

    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      ElMessage.error(getMessage(t('mtable.validation.numberMax', { field: prop, max: rule.max }), rule.message))
      return false
    }

    if (rule.pattern && typeof value === 'string') {
      const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern
      if (!pattern.test(value)) {
        ElMessage.error(getMessage(t('mtable.validation.pattern', { field: prop }), rule.message))
        return false
      }
    }

    if (typeof rule.validator === 'function') {
      let valid = true
      const validator = rule.validator as (rule: any, value: any, callback: (error?: string | Error) => void) => void
      await new Promise<void>((resolve) => {
        validator(rule, value, (error?: string | Error) => {
          if (error) {
            valid = false
            ElMessage.error(typeof error === 'string' ? error : error.message || t('mtable.validation.validator', { field: prop }))
          }
          resolve()
        })
      })
      if (!valid) return false
    }
  }

  return true
}