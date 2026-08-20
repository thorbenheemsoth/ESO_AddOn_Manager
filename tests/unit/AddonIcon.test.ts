import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import AddonIcon from '@/components/AddonIcon.vue'

describe('AddonIcon', () => {
  it('renders a thumbnail when one is provided', () => {
    const wrapper = mount(AddonIcon, {
      props: { thumb: 'https://example.test/thumb.jpg', name: 'Combat Metrics' },
    })

    expect(wrapper.get('img').attributes('src')).toBe('https://example.test/thumb.jpg')
    expect(wrapper.get('img').attributes('alt')).toBe('Combat Metrics')
  })

  it('falls back to the addon initial when the image fails or no thumbnail exists', async () => {
    const wrapper = mount(AddonIcon, {
      props: { thumb: 'https://example.test/thumb.jpg', name: 'combat metrics' },
    })

    await wrapper.get('img').trigger('error')
    expect(wrapper.text()).toBe('C')

    await wrapper.setProps({ thumb: null, name: '' })
    await nextTick()
    expect(wrapper.text()).toBe('?')
  })

  it('resets failed image state when the thumbnail source changes', async () => {
    const wrapper = mount(AddonIcon, {
      props: { thumb: 'https://example.test/old.jpg', name: 'Addon' },
    })

    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)

    await wrapper.setProps({ thumb: 'https://example.test/new.jpg' })
    expect(wrapper.get('img').attributes('src')).toBe('https://example.test/new.jpg')
  })
})
