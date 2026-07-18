/**
 * 国际化适配器接口（仅需要 t 函数即可）。
 * 消费方在 createSeqlo({ i18n }) 中传入。
 */
export interface I18nAdapter {
  t: (key: string, params?: Record<string, any>) => string
}

/**
 * localStorage 存储选项，与消费方 useAppLocalStorage 保持兼容。
 */
export interface StorageOptions {
  expires?: number
  encrypt?: boolean
  encryptKey?: string
}

/**
 * 最小化的 Ref 结构类型。
 * 仅要求有 .value 属性，避免依赖具体 vue 包安装（file: 依赖场景下
 * 不同 node_modules 中的 Ref 品牌符号 [RefSymbol] 会导致类型不兼容）。
 */
export interface RefLike<T> {
  value: T
}

/**
 * 消费方提供的本地存储 Hook 签名。
 * 返回元组：[响应式状态, setter, remover]。
 * 兼容 vue-web-super-storage 的 useLocalStorage 签名。
 *
 * 注意：第一个元素使用 RefLike<T> 而非 vue 的 Ref<T>，以避免跨包类型不兼容。
 * useStorageConfig 内部仅使用 .value 读取，RefLike 完全满足。
 */
export type UseLocalStorageFn = <T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions
) => [RefLike<T>, (value: T, setOptions?: any) => void, () => void]

const defaultI18n: I18nAdapter = {
  t: (key: string) => key,
}

const defaultUseLocalStorage: UseLocalStorageFn = <T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions
): [RefLike<T>, (value: T, setOptions?: any) => void, () => void] => {
  let storedValue: T = defaultValue
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      storedValue = JSON.parse(raw)
    }
  } catch {
  }

  const value: RefLike<T> = { value: storedValue }
  return [
    value,
    (newValue: T) => {
      value.value = newValue
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch {
      }
    },
    () => {
      try {
        localStorage.removeItem(key)
      } catch {
      }
    },
  ]
}

interface SeqloContext {
  i18n: I18nAdapter
  useLocalStorage: UseLocalStorageFn
}

const context: SeqloContext = {
  i18n: defaultI18n,
  useLocalStorage: defaultUseLocalStorage,
}

/** 内部使用：批量注入上下文 */
export function setContext(ctx: Partial<SeqloContext>): void {
  Object.assign(context, ctx)
}

/** 内部使用：获取 i18n 适配器 */
export function tryGetI18n(): I18nAdapter {
  return context.i18n
}

/** 内部使用：获取 i18n 适配器，未配置时返回默认实现（返回 key） */
export function getI18n(): I18nAdapter {
  return context.i18n
}

/** 内部使用：获取 useLocalStorage，未配置时返回默认实现（原生 localStorage） */
export function getUseLocalStorage(): UseLocalStorageFn {
  return context.useLocalStorage
}
