/**
 * Raw entry as returned by the esoui/mmoui filelist API.
 * Field names are kept exactly as the API returns them.
 */
export interface FileListEntry {
  UID: number
  UIVersion: string
  UIDate: number
  UIName: string
  UIAuthorName: string
  UIDownloadTotal: number
  /** Thumbnail image URLs (small) from the upstream site, if any. */
  UIIMG_Thumbs?: string[] | null
  /** Full-size preview image URLs from the upstream site, if any. */
  UIIMGs?: string[] | null
  /** Addon info page URL on esoui.com. */
  UIFileInfoURL?: string
  /** Top-level directory name(s) the addon installs to. */
  UIDir?: string[] | null
  [key: string]: unknown
}

/**
 * App-managed record of an installed addon.
 * This is our own clean schema (not the Python tool's) and lives in the
 * app data directory, not inside the addon folder.
 */
export interface InstalledAddon {
  /** esoui file id, matches FileListEntry.UID */
  uid: number
  /** Addon display name */
  name: string
  /** Author name */
  author: string
  /** Version string as reported by the upstream site */
  version: string
  /** Upstream "date" timestamp used for update comparison */
  date: number
  /** Total downloads on the upstream site */
  downloads: number
  /** Top-level directory extracted from the zip, relative to the addon path */
  directory: string
  /** Thumbnail URL cached from the upstream site (may be null for old records). */
  thumbnail?: string | null
}

/** Convert a raw API entry into our app-managed installed record. */
export function toInstalledAddon(entry: FileListEntry, directory: string): InstalledAddon {
  return {
    uid: entry.UID,
    name: entry.UIName,
    author: entry.UIAuthorName,
    version: entry.UIVersion,
    date: entry.UIDate,
    downloads: entry.UIDownloadTotal,
    directory,
    thumbnail: entry.UIIMG_Thumbs?.[0] ?? null,
  }
}

/** Convert an installed record back to a minimal FileListEntry-shaped object. */
export function toFileListEntry(addon: InstalledAddon): FileListEntry {
  return {
    UID: addon.uid,
    UIVersion: addon.version,
    UIDate: addon.date,
    UIName: addon.name,
    UIAuthorName: addon.author,
    UIDownloadTotal: addon.downloads,
  }
}