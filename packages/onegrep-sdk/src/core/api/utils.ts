import { log } from '../log.js'

import { AxiosError, AxiosResponse } from 'axios'

/**
 * Custom error class for OneGrep API errors.
 */
export class OneGrepApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OneGrepApiError'
  }
}

/**
 * Converts an Axios error to a OneGrep API error.
 * @param error - The Axios error to convert
 * @returns A OneGrep API error
 */
function axiosToOneGrepApiError(error: AxiosError): OneGrepApiError {
  return new OneGrepApiError(
    `The API call failed: ${error.code} ${error.config?.method} ${error.config?.url} ${error.response?.status} ${error.message} ${JSON.stringify(error.response?.data)}`
  )
}

function isAxiosResponse<T = any>(resp: any): resp is AxiosResponse<T> {
  if (resp && typeof resp === 'object' && 'status' in resp) {
    if (resp.status >= 200 && resp.status < 300) {
      return true
    }
    log.warn(`Unexpected response status: ${resp.status}`)
  }
  return false
}

function createAndLogApiError(error: unknown): OneGrepApiError {
  const returnError =
    error instanceof AxiosError
      ? axiosToOneGrepApiError(error)
      : new OneGrepApiError(`An unknown error occurred: ${error}`)

  // Log the error for debugging (NOTE: it's sometimes expected that the API call fails and we handle it upwards)
  log.error(
    `API call failed with error ${typeof error}: ${returnError.message}`
  )

  return returnError
}

/**
 * Makes an API call and handles errors by calling a callback instead of throwing exceptions.
 * @param apiCall - The async function that makes the API call
 * @param onError - Callback function that receives the error
 * @param onSuccess - Callback function that receives the successful response
 * @returns Promise<void> - Resolves when the call is complete, never rejects
 */
export async function makeApiCallWithCallback<T>(
  apiCall: () => Promise<T>,
  onSuccess?: (response: T) => void,
  onError?: (error: unknown) => void
): Promise<void> {
  try {
    const response = await apiCall()
    onSuccess?.(response)
  } catch (error) {
    onError?.(createAndLogApiError(error))
  }
}

/**
 * Makes an API call and returns a result object instead of throwing exceptions.
 * @param apiCall - The async function that makes the API call
 * @returns Promise<{ success: boolean; data?: T; error?: unknown }> - Always resolves with a result object
 */
export async function makeApiCallWithResult<T>(
  apiCall: () => Promise<unknown>
): Promise<{ success: boolean; data?: T; error?: unknown }> {
  try {
    const response = await apiCall()
    if (isAxiosResponse<T>(response)) {
      return {
        success: true,
        data: response.data as T
      }
    }
    log.warn('Unexpected response type', response)
    throw new Error(`Unexpected response type: ${response}`)
  } catch (error) {
    return {
      success: false,
      error: createAndLogApiError(error)
    }
  }
}
