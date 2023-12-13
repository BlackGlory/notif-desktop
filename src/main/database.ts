import { Level } from 'level'
import { ValueStream, EntryStream } from 'level-read-stream'
import { dropAsync, mapAsync, toArrayAsync } from 'iterable-operator'
import { pipe } from 'extra-utils'
import { assert, isUndefined } from '@blackglory/prelude'
import { stringifyTimeBasedId } from '@main/utils/create-id.js'
import { INotificationRecord } from '@src/contract.js'
import { getDataPath } from '@main/utils/paths.js'

let db: Level<string, INotificationRecord> | undefined

export function openDatabase(filename: string = getDataPath('data')): void {
  if (db) throw new Error('Database is opened')

  db = new Level(filename, {
    valueEncoding: 'json'
  })
}

export async function closeDatabase(): Promise<void> {
  if (isUndefined(db)) throw new Error('Database is closed')

  await db.close()
  db = undefined
}

export async function addNotifications(notifications: INotificationRecord[]): Promise<void> {
  assert(db, 'Database is not opened')

  await db.batch(notifications.map(notification => ({
    type: 'put'
  , key: notification.id
  , value: notification
  })))
}

export async function getAllNotifications(): Promise<INotificationRecord[]> {
  assert(db, 'Database is not opened')
  
  return await pipe(
    new ValueStream(db, { reverse: true })
  , notifications => mapAsync(notifications, notification => notification as any as INotificationRecord)
  , toArrayAsync
  )
}

export async function queryNotificationsById(
  beforeThisId: string
, { limit, skip = 0 }: {
    limit: number
  , skip?: number
  }
): Promise<INotificationRecord[]> {
  assert(db, 'Database is not opened')

  return await pipe(
    new EntryStream(db, {
      reverse: true
    , limit: limit + skip
    , lt: beforeThisId
    })
  , items => mapAsync(items, item => (item as any as { key: string, value: INotificationRecord }).value)
  , notifications => dropAsync(notifications, skip)
  , toArrayAsync
  )
}

export async function queryNotificationsByTimestamp(
  beforeThisTimestamp: number 
, { limit, skip = 0 }: {
    limit: number
  , skip?: number
  }
): Promise<INotificationRecord[]> {
  assert(db, 'Database is not opened')

  return await pipe(
    new EntryStream(db, {
      reverse: true
    , limit: limit + skip
    , lt: stringifyTimeBasedId([beforeThisTimestamp, 0])
    })
  , items => mapAsync(items, item => (item as any as { key: string, value: INotificationRecord }).value)
  , notifications => dropAsync(notifications, skip)
  , toArrayAsync
  )
}

export async function deleteNotification(id: string): Promise<void> {
  assert(db, 'Database is not opened')

  await db.del(id)
}
