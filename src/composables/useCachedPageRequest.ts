import { ref } from 'vue'

const pageLoadedMap = new Map<string, boolean>()

export function useCachedPageRequest(pageKey: string) {
  const hasLoaded = ref(pageLoadedMap.get(pageKey) ?? false)

  const markLoaded = () => {
    hasLoaded.value = true
    pageLoadedMap.set(pageKey, true)
  }

  const resetLoaded = () => {
    hasLoaded.value = false
    pageLoadedMap.delete(pageKey)
  }

  const shouldLoad = (force = false) => {
    return force || !hasLoaded.value
  }

  return {
    hasLoaded,
    markLoaded,
    resetLoaded,
    shouldLoad,
  }
}
