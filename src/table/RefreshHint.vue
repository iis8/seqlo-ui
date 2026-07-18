<template>
  <div class="refresh-hint-container">
    <span v-if="hintVisible" class="refresh-hint">
      <el-icon><Clock /></el-icon>
      <span>{{ t('mtable.refreshHint', { minutes: elapsedMinutes }) }}</span>
      <el-button size="small" type="primary" link @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        {{ t('mtable.refresh') }}
      </el-button>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    interval?: number
  }>(),
  {
    interval: 5,
  }
)

const emit = defineEmits<{
  refresh: []
}>()

const lastRefreshTime = ref(Date.now())
const hintVisible = ref(false)
const elapsedMinutes = ref(0)
let refreshTimer: number | null = null

function updateLastRefreshTime() {
  lastRefreshTime.value = Date.now()
  hintVisible.value = false
  elapsedMinutes.value = 0
  startTimer()
}

function startTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  refreshTimer = window.setInterval(() => {
    elapsedMinutes.value = Math.floor((Date.now() - lastRefreshTime.value) / 60000)
    hintVisible.value = elapsedMinutes.value >= props.interval
  }, 60000)
}

function handleRefresh() {
  hintVisible.value = false
  emit('refresh')
}

watch(() => props.interval, () => {
  startTimer()
})

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

defineExpose({
  updateLastRefreshTime,
})
</script>