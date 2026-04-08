import { apiRequest } from '@/services/api-client'
import { ApiError } from '@/services/contracts'

export interface DraftBlock {
  label: string
  activities: string[]
}

export interface DraftDay {
  date: string
  activities: string[]
  blocks?: DraftBlock[] | null
  notesForDay?: string | null
}

export interface CoverPhotoOption {
  url: string
  caption?: string | null
}

export interface DraftItinerary {
  _id: string
  title: string
  startDate: string
  endDate: string
  activities: string[]
  tags: string[]
  destinationKeywords?: string
  coverPhotoOptions?: CoverPhotoOption[]
  description?: string | null
  language: string
  days?: DraftDay[] | null
}

export interface GenerationStatusResponse {
  generationRequestId: string
  status: 'pending' | 'completed' | 'failed'
  drafts?: DraftItinerary[]
  errorMessage?: string
  aiModel?: string
  aiResponseTimeMs?: number
}

export interface SelectDraftResponse {
  itineraryId: string
  title: string
  message: string
}

export interface ModelInfo {
  id: string
  label: string
}

const MODEL_TIMEOUT_MS: Record<string, number> = {
  'gpt-3.5-turbo': 90_000,
  'gpt-4o': 120_000,
  'gpt-5.4': 180_000,
}
const DEFAULT_TIMEOUT_MS = 120_000

const POLL_SCHEDULE_MS = [1000, 5000, 4000, 3000, 2000, 1000]

export function getTimeoutForModel(model?: string): number {
  if (model && model in MODEL_TIMEOUT_MS) {
    return MODEL_TIMEOUT_MS[model]
  }
  return DEFAULT_TIMEOUT_MS
}

export async function fetchAvailableModels(signal?: AbortSignal): Promise<ModelInfo[]> {
  const response = await apiRequest<{ models: ModelInfo[] }>(
    '/ai-generation/models',
    { method: 'GET', protected: true, signal },
  )
  return response.models
}

export async function startGeneration(
  prompt: string,
  model?: string,
  signal?: AbortSignal,
): Promise<{ generationRequestId: string; status: 'pending' }> {
  return apiRequest<{ generationRequestId: string; status: 'pending' }>(
    '/ai-generation/generate',
    {
      method: 'POST',
      body: { prompt, ...(model ? { model } : {}) },
      protected: true,
      signal,
    },
  )
}

export async function pollForDrafts(
  generationRequestId: string,
  signal?: AbortSignal,
): Promise<GenerationStatusResponse> {
  return apiRequest<GenerationStatusResponse>(
    `/ai-generation/status/${generationRequestId}`,
    {
      method: 'GET',
      protected: true,
      signal,
    },
  )
}

function waitForNextPoll(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, delayMs)

    const handleAbort = (): void => {
      window.clearTimeout(timeoutId)
      signal?.removeEventListener('abort', handleAbort)
      reject(new ApiError(499, { code: 'REQUEST_ABORTED', message: 'Request was aborted' }))
    }

    if (signal?.aborted) {
      handleAbort()
      return
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

export async function pollUntilComplete(
  generationRequestId: string,
  onTick?: () => void,
  signal?: AbortSignal,
  timeoutMs?: number,
): Promise<GenerationStatusResponse> {
  const deadline = Date.now() + (timeoutMs ?? DEFAULT_TIMEOUT_MS)
  let pollIndex = 0

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw new ApiError(499, { code: 'REQUEST_ABORTED', message: 'Request was aborted' })
    }

    const result = await pollForDrafts(generationRequestId, signal)

    if (result.status === 'completed' || result.status === 'failed') {
      return result
    }

    onTick?.()
    const delayMs = pollIndex < POLL_SCHEDULE_MS.length
      ? POLL_SCHEDULE_MS[pollIndex]
      : 1000
    pollIndex++
    await waitForNextPoll(delayMs, signal)
  }

  throw new ApiError(408, {
    code: 'GENERATION_TIMEOUT',
    message: 'Generation timed out',
  })
}

export async function selectDraft(
  draftId: string,
  generationRequestId: string,
  selectedPhotoUrl?: string,
  signal?: AbortSignal,
): Promise<SelectDraftResponse> {
  return apiRequest<SelectDraftResponse>('/ai-generation/draft/select', {
    method: 'POST',
    body: {
      draftId,
      generationRequestId,
      ...(selectedPhotoUrl ? { selectedPhotoUrl } : {}),
    },
    protected: true,
    signal,
  })
}
