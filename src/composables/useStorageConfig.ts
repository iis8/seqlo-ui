import { watch, onMounted, unref, isRef, type Ref, type WatchStopHandle } from 'vue'
import { useRoute } from 'vue-router'
import { getUseLocalStorage } from './_context'

type ConfigSource = Record<string, Ref<any> | any>

interface UseStorageConfigOptions {
  componentId: string
  fields?: string[]
  debounce?: number
  explicitProps?: Record<string, any>
  storageOptions?: {
    expires?: number
    encrypt?: boolean
    encryptKey?: string
  }
}

export function useStorageConfig(
  sources: ConfigSource | Ref<Record<string, any>> | Record<string, any>,
  options: UseStorageConfigOptions
) {
  const route = useRoute()
  const { componentId, fields = [], debounce = 300, explicitProps = {}, storageOptions = {} } = options

  // 存储键名
  // todo: 抽取独立插件时考虑是否需要支持自定义前缀
  const storageKey = `pageconfig:${route.path}:${componentId}`
  // 通过依赖注入获取宿主提供的 useLocalStorage，避免直接耦合 @/utils/storage
  const useAppLocalStorage = getUseLocalStorage()
  const [stored, setStored] = useAppLocalStorage<Record<string, any>>(storageKey, {}, storageOptions)

  // 获取配置源对象
  const getSources = () => unref(sources) as Record<string, any>

  // 获取字段值（自动解包 ref）
  const getValue = (key: string) => {
    const src = getSources()
    const val = src[key]
    return isRef(val) ? val.value : val
  }

  // 设置字段值（如果是 ref 则改 .value，否则直接改属性）
  const setValue = (key: string, val: any) => {
    const src = getSources()
    const current = src[key]
    if (isRef(current)) {
      current.value = val
    } else {
      src[key] = val
    }
  }

  // 保存所有配置到存储
  const saveAll = () => {
    const data: Record<string, any> = {}
    const keys = fields.length ? fields : Object.keys(getSources())
    keys.forEach(key => {
      data[key] = getValue(key)
    })
    // ✅ 使用 setStored 更新存储，自动同步 localStorage
    // 注意：setStored 会合并或覆盖整个存储对象，这里我们希望合并现有数据
    // 由于存储的是整个对象，我们直接设置新数据（保留未改动的字段）
    const current = stored.value || {}
    setStored({ ...current, ...data })
  }

  // 恢复配置（从存储中读取并覆盖到 sources）
  const restore = () => {
    const data = stored.value || {}
    const keys = fields.length ? fields : Object.keys(getSources())

    // 1. 先处理 explicitProps（最高优先级）
    if (explicitProps) {
      keys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(explicitProps, key)) {
          const propVal = explicitProps[key]
          if (propVal !== undefined) {
            setValue(key, propVal)
            // 同时更新存储，保证下次打开以 prop 为准
            const current = stored.value || {}
            setStored({ ...current, [key]: propVal })
          }
        }
      })
    }

    // 2. 应用存储数据（但不要覆盖 explicitProps 已设置的字段）
    keys.forEach(key => {
      if (explicitProps && explicitProps[key] !== undefined) return
      if (data && key in data) {
        setValue(key, data[key])
      }
    })
  }

  // 自动保存（防抖监听 sources 变化）
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let stopWatches: WatchStopHandle[] = []

  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveAll()
      saveTimer = null
    }, debounce)
  }

  const enableAutoSave = () => {
    const src = getSources()
    const keys = fields.length ? fields : Object.keys(src)
    keys.forEach(key => {
      const val = src[key]
      if (isRef(val)) {
        const stop = watch(val, () => scheduleSave(), { deep: true })
        stopWatches.push(stop)
      }
    })
  }

  // 生命周期
  onMounted(() => {
    restore()
    enableAutoSave()
  })

  // 手动控制
  const clearStorage = () => {
    setStored({})
  }

  const disableAutoSave = () => {
    stopWatches.forEach(stop => stop())
    stopWatches = []
    if (saveTimer) clearTimeout(saveTimer)
  }

  return {
    restore,
    manualSave: saveAll,
    clearStorage,
    disableAutoSave,
    // 暴露存储的 Ref 供外部直接操作（高级用法）
    storage: stored,
  }
}