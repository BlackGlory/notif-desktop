import * as http from 'http'
import { serve, RequestHandler, json, createError } from 'micro'
import {
  validateUniversalNotification
, UniversalNotification
} from 'universal-notification'
import { getError, getSuccess } from 'return-style'
import { createTimeBasedId, stringifyTimeBasedId } from '@main/utils/create-id.js'
import { isArray } from '@blackglory/prelude'
import { INotification } from '@src/contract.js'

interface IServerOptions {
  notify: (notifications: INotification[]) => void
}

export function createServer({ notify }: IServerOptions): http.Server {
  const handler: RequestHandler = async req => {
    if (req.url === '/health') return 'OK'

    const senderId = req.headers['x-sender-id'] as string | undefined
    const payload = await json(req)
    if (payload) {
      if (isArray<INotification>(payload)) {
        const notifications = payload
          .filter(x => getSuccess(() => validateUniversalNotification(x)))
          .map(x => createNotificationFromUniversalNotification(x, senderId))
        notify(notifications)
      } else {
        const err = getError(() => validateUniversalNotification(payload))
        if (err) {
          throw createError(400, err.message, err)
        } else {
          notify([createNotificationFromUniversalNotification(payload, senderId)])
        }
      }
      return ''
    } else {
      throw createError(
        400
      , 'The payload is not a valid JSON'
      , new Error('The payload is not a valid JSON')
      )
    }
  }

  return new http.Server(serve(handler))
}

function createNotificationFromUniversalNotification(
  notification: UniversalNotification
, senderId?: string
): INotification {
  const [timestamp, num] = createTimeBasedId()
  const id = stringifyTimeBasedId([timestamp, num])

  return {
    ...notification
  , id
  , senderId
  , timestamp
  }
}
