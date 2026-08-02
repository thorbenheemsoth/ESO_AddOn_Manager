import { describe, expect, it } from 'vitest'
import { toFileListEntry, toInstalledAddon, type FileListEntry, type InstalledAddon } from '@/lib/types'

function fileEntry(overrides: Partial<FileListEntry> = {}): FileListEntry {
  return {
    UID: 42,
    UIVersion: '2.0.0',
    UIDate: 123456,
    UIName: 'Inventory Insight',
    UIAuthorName: 'Author',
    UIDownloadTotal: 9001,
    UIIMG_Thumbs: ['https://example.test/thumb.jpg'],
    ...overrides,
  }
}

describe('type converters', () => {
  it('converts a filelist entry to an installed addon record', () => {
    expect(toInstalledAddon(fileEntry(), 'InventoryInsight')).toEqual({
      uid: 42,
      name: 'Inventory Insight',
      author: 'Author',
      version: '2.0.0',
      date: 123456,
      downloads: 9001,
      directory: 'InventoryInsight',
      thumbnail: 'https://example.test/thumb.jpg',
    })
  })

  it('stores a null thumbnail when no thumbnail is available', () => {
    expect(toInstalledAddon(fileEntry({ UIIMG_Thumbs: [] }), 'Addon').thumbnail).toBeNull()
    expect(toInstalledAddon(fileEntry({ UIIMG_Thumbs: null }), 'Addon').thumbnail).toBeNull()
  })

  it('converts an installed addon record to a minimal filelist entry', () => {
    const addon: InstalledAddon = {
      uid: 7,
      name: 'Combat Metrics',
      author: 'Tester',
      version: '1.2.3',
      date: 99,
      downloads: 12,
      directory: 'CombatMetrics',
      thumbnail: 'ignored',
    }

    expect(toFileListEntry(addon)).toEqual({
      UID: 7,
      UIVersion: '1.2.3',
      UIDate: 99,
      UIName: 'Combat Metrics',
      UIAuthorName: 'Tester',
      UIDownloadTotal: 12,
    })
  })
})
