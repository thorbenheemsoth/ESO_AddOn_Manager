import { describe, expect, it } from 'vitest'
import { getEntryByUid, getThumbUrl, searchAddons } from '@/lib/filelist'
import type { FileListEntry } from '@/lib/types'

function entry(overrides: Partial<FileListEntry>): FileListEntry {
  return {
    UID: 1,
    UIVersion: '1.0.0',
    UIDate: 0,
    UIName: 'Test Addon',
    UIAuthorName: 'Author',
    UIDownloadTotal: 0,
    ...overrides,
  }
}

describe('filelist helpers', () => {
  const filelist = [
    entry({ UID: 10, UIName: "Lucent's Minimap" }),
    entry({ UID: 20, UIName: 'Combat Metrics' }),
    entry({ UID: 30, UIName: 'Inventory Insight' }),
  ]

  it('searches addon names case-insensitively and trims the query', () => {
    expect(searchAddons(filelist, ' combat ')).toEqual([filelist[1]])
    expect(searchAddons(filelist, 'INSIGHT')).toEqual([filelist[2]])
  })

  it('returns no search results for an empty query', () => {
    expect(searchAddons(filelist, '   ')).toEqual([])
  })

  it('finds entries by UID', () => {
    expect(getEntryByUid(filelist, 20)).toBe(filelist[1])
    expect(getEntryByUid(filelist, 99)).toBeUndefined()
  })

  it('returns the first non-empty thumbnail URL', () => {
    expect(getThumbUrl(entry({ UIIMG_Thumbs: ['https://example.test/thumb.jpg'] }))).toBe(
      'https://example.test/thumb.jpg'
    )
    expect(getThumbUrl(entry({ UIIMG_Thumbs: [] }))).toBeNull()
    expect(getThumbUrl(entry({ UIIMG_Thumbs: null }))).toBeNull()
  })
})
