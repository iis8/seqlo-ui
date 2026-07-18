import { mergeWith } from 'lodash-es'
import { setContext } from './composables/_context'
import type { I18nAdapter, UseLocalStorageFn, StorageOptions } from './composables/_context'
import { seqloMessages } from './i18n'

export interface VueI18nInstance {
  global: {
    t: (key: string, params?: Record<string, any>) => string
    messages: { value: Record<string, any> }
    setLocaleMessage: (locale: string, message: any) => void
  }
}

export interface SeqloOptions {
  i18n?: VueI18nInstance
  useLocalStorage?: UseLocalStorageFn
}

function mergeMessages(seqloMsg: Record<string, any>, hostMsg: Record<string, any>): Record<string, any> {
  return mergeWith({}, seqloMsg, hostMsg, (seqloValue: any, hostValue: any) => {
    if (hostValue !== undefined) {
      if (typeof hostValue === 'object' && hostValue !== null && typeof seqloValue === 'object' && seqloValue !== null) {
        return undefined
      }
      return hostValue
    }
    return seqloValue
  })
}

function setupI18n(i18n?: VueI18nInstance): I18nAdapter | undefined {
  if (!i18n) return undefined

  Object.keys(seqloMessages).forEach((locale) => {
    const seqloMsg = seqloMessages[locale as keyof typeof seqloMessages]
    const hostMsg = i18n.global.messages.value[locale] || {}
    const mergedMsg = mergeMessages(seqloMsg, hostMsg)
    i18n.global.setLocaleMessage(locale, mergedMsg)
  })

  return { t: i18n.global.t.bind(i18n.global) }
}

export function createSeqlo(options: SeqloOptions = {}): void {
  const { i18n, useLocalStorage } = options
  const i18nAdapter = setupI18n(i18n)

  const ctx: Record<string, any> = {}
  if (i18nAdapter) ctx.i18n = i18nAdapter
  if (useLocalStorage) ctx.useLocalStorage = useLocalStorage

  if (Object.keys(ctx).length > 0) {
    setContext(ctx)
  }
}

export function install(app: any, options: SeqloOptions = {}): void {
  const i18n = options.i18n || (app.config.globalProperties.$i18n as VueI18nInstance | undefined)

  createSeqlo({
    i18n,
    useLocalStorage: options.useLocalStorage,
  })
}

export type { I18nAdapter, UseLocalStorageFn, StorageOptions }
