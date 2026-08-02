import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InstalledAddon } from '@/lib/types'

const mkdirMock = vi.fn()
const readTextFileMock = vi.fn()
const writeTextFileMock = vi.fn()
const appDataDirMock = vi.fn()
const joinMock = vi.fn()
const sepMock = vi.fn(() => '/')

vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: mkdirMock,
  readTextFile: readTextFileMock,
  writeTextFile: writeTextFileMock,
}))

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: appDataDirMock,
  join: joinMock,
  sep: sepMock,
}))

function addon(overrides: Partial<InstalledAddon> = {}): InstalledAddon {
  return {
    uid: 1,
    name: 'Addon',
    author: 'Author',
    version: '1.0.0',
    date: 1,
    downloads: 0,
    directory: 'Addon',
    ...overrides,
  }
}

describe('installed database helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    mkdirMock.mockReset()
    readTextFileMock.mockReset()
    writeTextFileMock.mockReset()
    appDataDirMock.mockReset()
    joinMock.mockReset()
    sepMock.mockReset()
    appDataDirMock.mockResolvedValue('/app/data')
    joinMock.mockImplementation((...parts: string[]) => Promise.resolve(parts.join('/')))
    sepMock.mockReturnValue('/')
  })

  it('loads installed addons and tolerates missing, corrupt, or non-array data', async () => {
    const { loadInstalled } = await import('@/lib/installed')

    readTextFileMock.mockResolvedValueOnce(JSON.stringify([addon()]))
    await expect(loadInstalled()).resolves.toEqual([addon()])

    readTextFileMock.mockRejectedValueOnce(new Error('missing'))
    await expect(loadInstalled()).resolves.toEqual([])

    readTextFileMock.mockResolvedValueOnce('{')
    await expect(loadInstalled()).resolves.toEqual([])

    readTextFileMock.mockResolvedValueOnce(JSON.stringify({ uid: 1 }))
    await expect(loadInstalled()).resolves.toEqual([])
  })

  it('saves installed addons to the app data database path', async () => {
    const { saveInstalled } = await import('@/lib/installed')
    const list = [addon()]

    await saveInstalled(list)

    expect(mkdirMock).toHaveBeenCalledWith('/app/data', { recursive: true })
    expect(writeTextFileMock).toHaveBeenCalledWith('/app/data/installed.json', JSON.stringify(list, null, 2))
  })

  it('upserts and removes records by UID', async () => {
    const { removeInstalledRecord, upsertInstalled } = await import('@/lib/installed')

    readTextFileMock.mockResolvedValueOnce(JSON.stringify([addon({ uid: 1, name: 'Old' })]))
    await expect(upsertInstalled(addon({ uid: 1, name: 'New' }))).resolves.toEqual([
      addon({ uid: 1, name: 'New' }),
    ])

    readTextFileMock.mockResolvedValueOnce(JSON.stringify([addon({ uid: 1 }), addon({ uid: 2 })]))
    await expect(upsertInstalled(addon({ uid: 3 }))).resolves.toEqual([
      addon({ uid: 1 }),
      addon({ uid: 2 }),
      addon({ uid: 3 }),
    ])

    readTextFileMock.mockResolvedValueOnce(JSON.stringify([addon({ uid: 1 }), addon({ uid: 2 })]))
    await expect(removeInstalledRecord(1)).resolves.toEqual([addon({ uid: 2 })])
  })

  it('finds installed addons by UID', async () => {
    const { findInstalled } = await import('@/lib/installed')
    const list = [addon({ uid: 1 }), addon({ uid: 2 })]

    expect(findInstalled(list, 2)).toBe(list[1])
    expect(findInstalled(list, 99)).toBeUndefined()
  })
})
