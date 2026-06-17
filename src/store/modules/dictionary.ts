import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getAllCountryListApi, getProjectChannelUseListApi, getProjectListApi } from '@/api/auth'
import { ApiStatus } from '@/lib/status'

type ProjectItem = {
  id: string | number
  name: string
  code: string
  price: number
  icon?: string
}

type CountryItem = {
  id: string | number
  name: string
  code: string
  flag?: string
  phoneCode?: string
}

type ChannelConfig = {
  price: number
  supportType: number
  supportCountryIds: string[]
  countryPrices: Record<string, string>
  userPrices: Record<string, string>
  supplierId: string
  projectChannelId: string
}

export const useDictionaryStore = defineStore('dictionaryStore', () => {
  const projects = ref<ProjectItem[]>([])
  const countries = ref<CountryItem[]>([])
  const projectChannels = ref<Record<string, ChannelConfig>>({})
  const loadingProjects = ref(false)
  const loadingCountries = ref(false)
  const loadingChannels = ref<Record<string, boolean>>({})
  const projectsLoaded = ref(false)
  const countriesLoaded = ref(false)

  const getProjectById = computed(() => (projectId: string | number) => {
    return projects.value.find((item) => String(item.id) === String(projectId))
  })

  const getCountryById = computed(() => (countryId: string | number) => {
    return countries.value.find((item) => String(item.id) === String(countryId))
  })

  const fetchProjects = async (force = false) => {
    if (!force && projectsLoaded.value) return projects.value
    if (loadingProjects.value) return projects.value

    loadingProjects.value = true
    try {
      const res = await getProjectListApi()
      if (res.code === ApiStatus.success) {
        projects.value = res.data || []
        projectsLoaded.value = true
      }
      return projects.value
    } finally {
      loadingProjects.value = false
    }
  }

  const fetchCountries = async (force = false) => {
    if (!force && countriesLoaded.value) return countries.value
    if (loadingCountries.value) return countries.value

    loadingCountries.value = true
    try {
      const res = await getAllCountryListApi()
      if (res.code === ApiStatus.success) {
        countries.value = res.data || []
        countriesLoaded.value = true
      }
      return countries.value
    } finally {
      loadingCountries.value = false
    }
  }

  const fetchProjectChannel = async (projectId: string | number, force = false) => {
    const key = String(projectId)
    if (!key) return null
    if (!force && projectChannels.value[key]) return projectChannels.value[key]
    if (loadingChannels.value[key]) return projectChannels.value[key] || null

    loadingChannels.value = {
      ...loadingChannels.value,
      [key]: true,
    }

    try {
      const res = await getProjectChannelUseListApi({ projectId })
      if (res.code === ApiStatus.success) {
        projectChannels.value = {
          ...projectChannels.value,
          [key]: res.data || null,
        }
      }

      return projectChannels.value[key] || null
    } finally {
      loadingChannels.value = {
        ...loadingChannels.value,
        [key]: false,
      }
    }
  }

  const ensureBaseDictionaries = async () => {
    await Promise.all([fetchProjects(), fetchCountries()])
    return {
      projects: projects.value,
      countries: countries.value,
    }
  }

  const resetDictionary = () => {
    projects.value = []
    countries.value = []
    projectChannels.value = {}
    projectsLoaded.value = false
    countriesLoaded.value = false
    loadingChannels.value = {}
  }

  return {
    projects,
    countries,
    projectChannels,
    loadingProjects,
    loadingCountries,
    getProjectById,
    getCountryById,
    fetchProjects,
    fetchCountries,
    fetchProjectChannel,
    ensureBaseDictionaries,
    resetDictionary,
  }
})
