import { log } from '../log.js'

import { AxiosError } from 'axios'

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
    `An axios error occurred: ${error.code} ${error.config?.method} ${error.config?.url} ${error.response?.status} ${error.message} ${error.response?.data}`
  )
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
    // Log the error
    log.error(`API call failed: ${typeof error}`)

    if (error instanceof AxiosError) {
      log.error(`API call failed: ${error.config?.method} ${error.config?.url}`)
      onError?.(axiosToOneGrepApiError(error))
    } else {
      onError?.(new OneGrepApiError(`An unknown error occurred: ${error}`))
    }
  }
}

/**
 * Makes an API call and returns a result object instead of throwing exceptions.
 * @param apiCall - The async function that makes the API call
 * @returns Promise<{ success: boolean; data?: T; error?: unknown }> - Always resolves with a result object
 */
export async function makeApiCallWithResult<T>(
  apiCall: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: unknown }> {
  try {
    const response = await apiCall()
    return { success: true, data: response }
  } catch (error) {
    // Log the error for debugging
    log.error(`API call failed: ${typeof error}`)

    if (error instanceof AxiosError) {
      return {
        success: false,
        error: axiosToOneGrepApiError(error)
      }
    } else {
      return {
        success: false,
        error: new OneGrepApiError(`An unknown error occurred: ${error}`)
      }
    }
  }
}
