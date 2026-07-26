import { fetch } from '@tauri-apps/plugin-http'
import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs'
import { filelistCachePath, dirname } from './paths'
import type { FileListEntry } from './types'

const FILELIST_URL = 'https://api.mmoui.com/v3/game/ESO/filelist.json'
const DOWNLOAD_URL = 'https://www.esoui.com/downloads/getfile.php?id='

/**
 * Download the upstream filelist and cache it as JSON in the app data dir.
 * Returns the parsed list. Throws on non-200 responses.
 */
export async function downloadFilelist(): Promise<FileListEntry[]> {
  const res = await fetch(FILELIST_URL)
  if (!res.ok) {
    throw new Error(`Failed to download filelist: HTTP ${res.status}`)
  }
  const text = await res.text()
  let data: FileListEntry[]
  try {
    data = JSON.parse(text) as FileListEntry[]
  } catch (e) {
    throw new Error(`Filelist is not valid JSON: ${(e as Error).message}`)
  }

  const cachePath = await filelistCachePath()
  await mkdir(dirname(cachePath), { recursive: true })
  await writeTextFile(cachePath, text)
  return data
}

/**
 * Fetch a zip archive for the given addon id and return its bytes.
 * Validates the HTTP status and content-type (must be application/zip),
 * mirroring the checks in the original Python tool.
 */
export async function fetchZip(id: number): Promise<Uint8Array> {
  const res = await fetch(`${DOWNLOAD_URL}${id}`)
  if (!res.ok) {
    throw new Error(`Failed to download addon (id=${id}): HTTP ${res.status}`)
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/zip')) {
    throw new Error(
      `The downloaded file for addon id=${id} is not a zip (content-type: "${contentType}").`,
    )
  }
  const buf = new Uint8Array(await res.arrayBuffer())
  return buf
}