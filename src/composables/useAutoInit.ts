import { mergeWith } from 'lodash-es'
import { seqloMessages } from '../i18n'

let initialized = false

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

function injectToTarget(target: any): void {
  Object.keys(seqloMessages).forEach((locale) => {
    const seqloMsg = seqloMessages[locale as keyof typeof seqloMessages]
    const hostMsg = target.messages.value?.[locale] || {}
    const mergedMsg = mergeMessages(seqloMsg, hostMsg)
    target.setLocaleMessage(locale, mergedMsg)
  })
}

function doInit(): boolean {
  const vue = (window as any).__VUE__ || (window as any).Vue
  if (vue) {
    const i18n = vue.config?.globalProperties?.$i18n
    if (i18n) {
      const target = i18n.global || i18n
      if (target.messages && target.setLocaleMessage) {
        injectToTarget(target)
        return true
      }
    }
  }

  const app = (window as any).__VUE_APP__
  if (app) {
    const i18n = app.config?.globalProperties?.$i18n
    if (i18n) {
      const target = i18n.global || i18n
      if (target.messages && target.setLocaleMessage) {
        injectToTarget(target)
        return true
      }
    }
  }

  return false
}

export function tryAutoInit(): void {
  if (initialized) return

  if (doInit()) {
    initialized = true
    return
  }

  const tryLater = () => {
    if (initialized) return
    if (doInit()) {
      initialized = true
      return
    }
    setTimeout(tryLater, 100)
  }

  setTimeout(tryLater, 100)
}

export function tryInitFromComponent(i18nContext: any): void {
  if (initialized) return

  try {
    if (!i18nContext || !i18nContext.setLocaleMessage || !i18nContext.messages) return

    Object.keys(seqloMessages).forEach((lang) => {
      const seqloMsg = seqloMessages[lang as keyof typeof seqloMessages]
      const hostMsg = i18nContext.messages.value?.[lang] || {}
      const mergedMsg = mergeMessages(seqloMsg, hostMsg)
      i18nContext.setLocaleMessage(lang, mergedMsg)
    })

    initialized = true
  } catch {
  }
}
