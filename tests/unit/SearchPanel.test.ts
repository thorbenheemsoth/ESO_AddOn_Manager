import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import SearchPanel from '@/components/SearchPanel.vue'
import type { FileListEntry, InstalledAddon } from '@/lib/types'

let store: ReturnType<typeof createStore>

vi.mock('@/stores/addons', () => ({
  useAddonsStore: () => store,
}))

function fileEntry(overrides: Partial<FileListEntry> = {}): FileListEntry {
  return {
    UID: 1,
    UIVersion: '1.0.0',
    UIDate: 1,
    UIName: 'Addon One',
    UIAuthorName: 'Author',
    UIDownloadTotal: 10,
    ...overrides,
  }
}

function installed(overrides: Partial<InstalledAddon> = {}): InstalledAddon {
  return {
    uid: 1,
    name: 'Addon One',
    author: 'Author',
    version: '1.0.0',
    date: 1,
    downloads: 10,
    directory: 'AddonOne',
    ...overrides,
  }
}

function createStore() {
  return reactive({
    addonPath: '/addons' as string | null,
    hasFilelist: true,
    installed: [] as InstalledAddon[],
    loading: false,
    searchQuery: '',
    searchResults: [] as FileListEntry[],
    pendingDepChoice: null as { dep: string; candidates: FileListEntry[] } | null,
    runSearch: vi.fn(),
    installAddon: vi.fn(),
    resolveDepChoice: vi.fn(),
  })
}

function mountPanel() {
  return mount(SearchPanel, {
    global: {
      stubs: {
        AddonIcon: { template: '<span data-test="addon-icon" />' },
      },
    },
  })
}

describe('SearchPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    store = createStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables search and shows setup guidance until an addon path is configured', () => {
    store.addonPath = null

    const wrapper = mountPanel()

    expect(wrapper.get('input[type="search"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Pick an AddOn folder above to search for addons.')
  })

  it('debounces search input into the store', async () => {
    const wrapper = mountPanel()

    await wrapper.get('input[type="search"]').setValue('merchant')
    expect(store.runSearch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(251)
    expect(store.runSearch).toHaveBeenCalledWith('merchant')
  })

  it('renders results and installs the selected addon', async () => {
    const target = fileEntry({ UID: 7, UIName: 'Combat Metrics', UIDownloadTotal: 20 })
    store.searchResults = [target]

    const wrapper = mountPanel()
    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('Combat Metrics')
    expect(store.installAddon).toHaveBeenCalledWith(target)
  })

  it('marks already installed results and blocks duplicate installs', () => {
    store.searchResults = [fileEntry({ UID: 7, UIName: 'Combat Metrics' })]
    store.installed = [installed({ uid: 7 })]

    const wrapper = mountPanel()
    const button = wrapper.get('button')

    expect(button.text()).toBe('Installed')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('lets the user choose or skip a dependency candidate', async () => {
    const candidate = fileEntry({ UID: 3, UIName: 'LibFoo' })
    store.pendingDepChoice = { dep: 'LibFoo', candidates: [candidate] }

    const wrapper = mountPanel()
    await wrapper.findAll('button').find((button) => button.text().includes('LibFoo'))?.trigger('click')
    expect(store.resolveDepChoice).toHaveBeenCalledWith(candidate)

    store.resolveDepChoice.mockClear()
    await nextTick()
    await wrapper.findAll('button').find((button) => button.text() === 'Skip this dependency')?.trigger('click')
    expect(store.resolveDepChoice).toHaveBeenCalledWith(null)
  })
})
