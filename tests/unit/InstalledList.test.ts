import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import InstalledList from '@/components/InstalledList.vue'
import type { InstalledAddon } from '@/lib/types'

let store: ReturnType<typeof createStore>

vi.mock('@/stores/addons', () => ({
  useAddonsStore: () => store,
}))

function installed(overrides: Partial<InstalledAddon> = {}): InstalledAddon {
  return {
    uid: 1,
    name: 'Addon One',
    author: 'Author',
    version: '1.0.0',
    date: 1,
    downloads: 10,
    directory: 'AddonOne',
    thumbnail: null,
    ...overrides,
  }
}

function createStore() {
  return reactive({
    needsSetup: false,
    installed: [] as InstalledAddon[],
    updateMap: {} as Record<number, boolean>,
    loading: false,
    updateAll: vi.fn(),
    updateAddon: vi.fn(),
    removeAddon: vi.fn(),
    thumbForUid: vi.fn(() => null),
  })
}

function mountList() {
  return mount(InstalledList, {
    global: {
      stubs: {
        AddonIcon: { template: '<span data-test="addon-icon" />' },
      },
    },
  })
}

describe('InstalledList', () => {
  beforeEach(() => {
    store = createStore()
  })

  it('shows setup and empty states', () => {
    store.needsSetup = true
    expect(mountList().text()).toContain('Pick an AddOn folder above')

    store.needsSetup = false
    expect(mountList().text()).toContain('No addons tracked yet')
  })

  it('renders installed addons and removes the selected addon', async () => {
    const addon = installed({ uid: 2, name: 'Combat Metrics' })
    store.installed = [addon]

    const wrapper = mountList()
    await wrapper.findAll('button').find((button) => button.text() === 'Delete')?.trigger('click')

    expect(wrapper.text()).toContain('Combat Metrics')
    expect(store.removeAddon).toHaveBeenCalledWith(addon)
  })

  it('shows update actions when updates are available', async () => {
    const addon = installed({ uid: 2, name: 'Combat Metrics' })
    store.installed = [addon]
    store.updateMap = { 2: true }

    const wrapper = mountList()
    await wrapper.findAll('button').find((button) => button.text() === 'Update all')?.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Upgrade')?.trigger('click')

    expect(wrapper.text()).toContain('1 update(s) available')
    expect(store.updateAll).toHaveBeenCalled()
    expect(store.updateAddon).toHaveBeenCalledWith(addon)
  })
})
