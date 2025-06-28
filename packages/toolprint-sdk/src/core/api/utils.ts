/**
 * Custom error class for OneGrep API errors.
 */
export class OneGrepApiError extends Error {
  private readonly _status?: number
  private readonly _data?: unknown

  constructor(
    private readonly causedByError: Error | unknown,
    response?: Response
  ) {
    // Handle different error types from the new fetch-based client
    let message = 'Unknown API error'
    let data: unknown
    let status: number | undefined

    if (causedByError instanceof Error) {
      message = causedByError.message

      // Handle ZodError (validation errors from the new client)
      if ('issues' in causedByError) {
        // This is a ZodError with validation issues
        data = (causedByError as any).issues
      } else if ('response' in causedByError) {
        // For fetch errors, the error might have additional properties
        data = (causedByError as any).response
      }
    } else if (typeof causedByError === 'string') {
      message = causedByError
    } else if (typeof causedByError === 'object' && causedByError !== null) {
      // The new client may throw parsed error objects directly
      data = causedByError
      message = JSON.stringify(causedByError)
    }

    if (response) {
      status = response.status
      // If we have a response but no data from causedByError, use causedByError as data
      if (!data) {
        data = causedByError
      }
    }

    super(message)
    this.name = 'OneGrepApiError'
    this._status = status
    this._data = data
  }

  get cause(): Error | unknown {
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
    onError?.(new OneGrepApiError(error))
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

    if (response && typeof response === 'object' && 'data' in response) {
      return {
        success: true,
        data: response.data as unknown as T
      }
    }
    throw new Error(`Unexpected response type: ${typeof response}`)
  } catch (error) {
    // The new client throws the parsed error response directly
    // We need to create a OneGrepApiError with the error data
    return {
      success: false,
      error: new OneGrepApiError(error)
    }
  }
}
