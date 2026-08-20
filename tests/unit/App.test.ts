import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import App from '@/App.vue'

let store: ReturnType<typeof createStore>

vi.mock('@/stores/addons', () => ({
  useAddonsStore: () => store,
}))

function createStore() {
  return reactive({
    error: null as string | null,
    initApp: vi.fn(),
    clearError: vi.fn(),
  })
}

describe('App', () => {
  beforeEach(() => {
    store = createStore()
  })

  it('initializes the app on mount and renders the main regions', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          SettingsBar: true,
          InstalledList: true,
          SearchPanel: true,
        },
      },
    })

    expect(store.initApp).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Installed')
    expect(wrapper.text()).toContain('Search & Install')
  })

  it('shows and clears store errors', async () => {
    store.error = 'failed'
    const wrapper = mount(App, {
      global: {
        stubs: {
          SettingsBar: true,
          InstalledList: true,
          SearchPanel: true,
        },
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('failed')
    expect(store.clearError).toHaveBeenCalled()
  })
})
