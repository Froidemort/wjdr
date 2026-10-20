import Dexie, { type Table } from 'dexie'

export interface TileRecord {
  /** `${version}/${z}/${x}/${y}` */
  key: string
  version: string
  blob: Blob
  size: number
  lastAccess: number
}

interface MapTileDb extends Dexie {
  tiles: Table<TileRecord, string>
}

const db = new Dexie('wjdr-map-tiles') as MapTileDb

db.version(1).stores({
  tiles: '&key, version, lastAccess',
})

export const mapTileTable = db.tiles
