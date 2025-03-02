import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { IS_PLATFORM } from '../constants'
import { apiAuthenticate } from './apiAuthenticate'
import logger from '../logger'

// Purpose of this apiWrapper is to function like a global catchall for ANY errors
// It's a safety net as the API service should never drop, nor fail

export default async function apiWrapper(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: NextApiHandler,
  options?: { withAuth: boolean }
) {
  try {
    const { withAuth } = options || {}

    if (IS_PLATFORM && withAuth) {
      const response = await apiAuthenticate(req, res)
      if (response.error) {
        return res.status(401).json({
          error: {
            message: `Unauthorized: ${response.error.message}`,
          },
        })
      } else {
        // Attach user information to request parameters
        (req as any).user = response
      }
    }

    logger.info(`>URL: ${req.url} (${req.method})\n>REQUEST BODY: ${JSON.stringify(req.body)}\n>HEADERS: ${JSON.stringify(req.headers)}\n`)
    const func = handler
    return await func(req, res)
  } catch (error) {
    logger.error(error)

    return res.status(500).json({ error })
  }
}
