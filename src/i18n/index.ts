import zh from './locales/zh'
import en from './locales/en'

export interface SeqloI18nMessages {
  zh: typeof zh
  en: typeof en
}

/**
 * seqlo-ui 的 i18n 翻译消息。
 * 宿主应用应在创建 vue-i18n 实例时，将这些消息合并到自己的 messages 中。
 *
 * @example
 * ```ts
 * import { createI18n } from 'vue-i18n'
 * import { seqloMessages } from '@seqlo/ui'
 *
 * const i18n = createI18n({
 *   messages: {
 *     zh: { ...yourZhMessages, ...seqloMessages.zh },
 *     en: { ...yourEnMessages, ...seqloMessages.en },
 *   },
 * })
 * ```
 */
export const seqloMessages: SeqloI18nMessages = {
  zh,
  en,
}
