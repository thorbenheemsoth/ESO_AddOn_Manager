import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import SettingsBar from '@/components/SettingsBar.vue'

const { openMock } = vi.hoisted(() => ({
  openMock: vi.fn(),
}))
let store: ReturnType<typeof createStore>

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: openMock,
}))

vi.mock('@/stores/addons', () => ({
  useAddonsStore: () => store,
}))

function createStore() {
  return reactive({
    addonPath: null as string | null,
    loading: false,
    installDeps: true,
    filelistLoadedAt: null as number | null,
    error: null as string | null,
    clearError: vi.fn(),
    refreshFilelist: vi.fn(),
    setAddonDir: vi.fn(),
    setInstallDeps: vi.fn(),
  })
}

describe('SettingsBar', () => {
  beforeEach(() => {
    store = createStore()
    openMock.mockReset()
  })

  it('opens the folder dialog and saves a typed path', async () => {
    const wrapper = mount(SettingsBar)

    await wrapper.findAll('button').find((button) => button.text().includes('Set AddOn folder'))?.trigger('click')
    await wrapper.get('input[type="text"]').setValue(' /addons ')
    await wrapper.findAll('button').find((button) => button.text() === 'Save')?.trigger('click')

    expect(store.clearError).toHaveBeenCalled()
    expect(store.setAddonDir).toHaveBeenCalledWith('/addons')
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
  })

  it('keeps the folder dialog open when saving reports an error', async () => {
    store.setAddonDir.mockImplementation(() => {
      store.error = 'cannot read folder'
    })
    const wrapper = mount(SettingsBar)

    await wrapper.findAll('button').find((button) => button.text().includes('Set AddOn folder'))?.trigger('click')
    await wrapper.get('input[type="text"]').setValue('/bad')
    await wrapper.findAll('button').find((button) => button.text() === 'Save')?.trigger('click')

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('cannot read folder')
  })

  it('uses the native folder picker and refreshes the filelist', async () => {
    store.addonPath = '/addons'
    openMock.mockResolvedValue('/picked')
    const wrapper = mount(SettingsBar)

    await wrapper.findAll('button').find((button) => button.text().includes('Change AddOn folder'))?.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Browse…')?.trigger('click')
    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe('/picked')

    await wrapper.findAll('button').find((button) => button.text() === 'Refresh filelist')?.trigger('click')
    expect(store.refreshFilelist).toHaveBeenCalled()
  })

  it('persists the auto-install dependencies toggle', async () => {
    const wrapper = mount(SettingsBar)

    await wrapper.get('input[type="checkbox"]').setValue(false)

    expect(store.setInstallDeps).toHaveBeenCalledWith(false)
  })
})
