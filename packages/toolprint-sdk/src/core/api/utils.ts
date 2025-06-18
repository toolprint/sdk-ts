import { AxiosError } from 'axios'

/**
 * Custom error class for OneGrep API errors.
 */
export class OneGrepApiError extends Error {
  private readonly _status?: number
  private readonly _data?: unknown

  constructor(private readonly causedByError: Error) {
    super(causedByError.message)
    this.name = 'OneGrepApiError'
    if (causedByError instanceof AxiosError) {
      this._status = causedByError.response?.status ?? 500
      this._data = causedByError.response?.data
    }
  }

  get cause(): Error {
    return this.causedByError
  }

  get status(): number | undefined {
    return this._status
  }

  get data(): unknown {
    return this._data
  }
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
    onError?.(new OneGrepApiError(error as Error))
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
    if (response instanceof AxiosError) {
      return {
        success: false,
        error: new OneGrepApiError(response)
      }
    }

    if (response && typeof response === 'object' && 'data' in response) {
      return {
        success: true,
        data: response.data as unknown as T
      }
    }
    throw new Error(`Unexpected response type: ${typeof response}`)
  } catch (error) {
    return {
      success: false,
      error: new OneGrepApiError(error as Error)
    }
  }
}
