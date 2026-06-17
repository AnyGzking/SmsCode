import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function updateWebsiteFavicon(iconUrl?: string) {
  if (typeof document === 'undefined' || !iconUrl) return

  let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.href = String(iconUrl).replace(/`/g, '').trim()
}

export function updateWebsiteMeta(options: {
  title?: string
  keywords?: string
  description?: string
}) {
  if (typeof document === 'undefined') return

  const { title, keywords, description } = options

  if (title) {
    document.title = String(title).replace(/`/g, '').trim()
  }

  const ensureMeta = (name: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = name
      document.head.appendChild(meta)
    }
    return meta
  }

  if (keywords) {
    ensureMeta('keywords').content = String(keywords).replace(/`/g, '').trim()
  }

  if (description) {
    ensureMeta('description').content = String(description).replace(/`/g, '').trim()
  }
}
