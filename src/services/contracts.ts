export interface ErrorDetail {
  field?: string
  message: string
}

export interface ErrorResponse {
  code: string
  message: string
  details?: ErrorDetail[]
}

export type SupportedLanguage = 'en' | 'cs-CZ'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface UserProfile {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  preferredLanguage: SupportedLanguage
  authProviders: Array<'password' | 'google' | 'apple' | 'github'>
  createdAt: string
  updatedAt: string
}

export class ApiError extends Error {
  status: number
  code: string
  details?: ErrorDetail[]

  constructor(status: number, payload: Partial<ErrorResponse>) {
    super(payload.message ?? 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = payload.code ?? 'UNKNOWN_ERROR'
    this.details = payload.details
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  protected?: boolean
  isRetrying?: boolean
  timeoutMs?: number
  skipAuthRefreshOn401?: boolean
  signal?: AbortSignal
}

export type ClientLogLevel = 'warn' | 'error'
export type ClientLogKind = 'console' | 'window-error' | 'unhandledrejection'

export interface ClientLogRequest {
  level: ClientLogLevel
  kind: ClientLogKind
  message: string
  details?: string
  stack?: string
  url?: string
}

export interface WebReference {
  url: string
  caption?: string
  type?: 'photo' | 'video' | 'webpage'
  source?: 'unsplash'
  authorName?: string
  authorUrl?: string
  sourceUrl?: string
  downloadLocation?: string
}

export interface PhotoSearchResult extends WebReference {
  thumbnailUrl?: string
}

export type ActivityType = 'note' | 'flight' | 'accommodation' | 'transfer' | 'poi' | 'carRental' | 'custom' | 'food' | 'divider' | 'shopping' | 'tour'

export type AccommodationPlatform = 'booking' | 'airbnb' | 'agoda' | 'direct' | 'other'

export interface ActivityDetails {
  cuisine?: string
  guidanceMode?: 'selfGuided' | 'guided'
  nights?: number
  guests?: number
  checkInFrom?: string
  checkInUntil?: string
  checkOutUntil?: string
  platform?: AccommodationPlatform
  contactPhone?: string
  contactEmail?: string
  bookingRef?: string
}

export interface ItineraryActivity {
  id: string
  type: ActivityType
  title: string
  text?: string
  time?: string
  timeEnd?: string
  anchorDate?: string | null
  details?: ActivityDetails
  references?: WebReference[]
  locations?: Array<{ caption?: string; coordinates?: number[]; address?: string }>
}

export type ItineraryActivityInput = ItineraryActivity

export interface ItineraryDay {
  dayNumber: number
  date?: string
  summary?: string
  activities: ItineraryActivity[]
}

export interface ItineraryDayInput {
  dayNumber: number
  summary?: string
  activities: ItineraryActivityInput[]
}

export interface ItinerarySummary {
  id: string
  title: string
  coverPhoto?: WebReference
  tags: string[]
  visibility: 'private' | 'shared' | 'public'
  startDate?: string
  endDate?: string
  dayCount: number
  activityCount: number
  createdAt: string
  updatedAt: string
}

export interface ItineraryDetail {
  id: string
  userId: string
  templateId?: string
  title: string
  description?: string
  tags: string[]
  visibility: 'private' | 'shared' | 'public'
  coverPhoto?: WebReference
  startDate?: string
  endDate?: string
  schemaVer: number
  hasShareLink: boolean
  days: ItineraryDay[]
  activityBench: ItineraryActivity[]
  createdAt: string
  updatedAt: string
}

export type SharedItineraryDetail = Omit<ItineraryDetail, 'userId' | 'hasShareLink'>

export interface AnchorDateConflictResponse {
  code: 'CONFLICT'
  message: string
}

export interface ShareTokenResponse {
  shareToken: string
  shareUrl: string
}

export interface ItineraryListResponse {
  items: ItinerarySummary[]
  page: number
  limit: number
  total: number
}

export interface ItineraryListParams {
  page?: number
  limit?: number
  sortBy?: 'plannedStartDate'
  sortOrder?: 'asc'
}

export interface UpdateItineraryRequest {
  title?: string
  description?: string
  tags?: string[]
  visibility?: 'private' | 'shared' | 'public'
  coverPhoto?: WebReference | null
  startDate?: string | null
  days?: ItineraryDayInput[]
  activityBench?: ItineraryActivityInput[]
}

export interface InsertItineraryDayRequest {
  dayNumber: number
  summary?: string
}

export type DeleteItineraryDayMode = 'delete' | 'move' | 'bench'

export interface DeleteItineraryDayRequest {
  dayNumber: number
  mode: DeleteItineraryDayMode
  targetDayNumber?: number
}

export type LanguageMode = 'auto' | 'curated' | 'other'
export type CuratedLanguageCode = 'en' | 'cs-CZ' | 'de' | 'fr' | 'es' | 'it' | 'pt-BR'
export type TimingValue = 'thisWeekend' | 'nextWeek' | 'nextMonth' | 'summerHoliday' | 'winterHoliday' | 'customDates' | 'flexible' | 'other'
export type TravelerProfileValue = 'solo' | 'couple' | 'familyWithKids' | 'friendsGroup' | 'business' | 'other'
export type BudgetProfileValue = 'budget' | 'midRange' | 'premium' | 'luxury' | 'other'

export interface GenerationContextOptions {
  languageMode?: LanguageMode
  languageCode?: CuratedLanguageCode
  languageOther?: string
  departureFrom?: string
  timing?: TimingValue
  timingOther?: string
  travelerProfile?: TravelerProfileValue
  travelerProfileOther?: string
  budgetProfile?: BudgetProfileValue
  budgetProfileOther?: string
}
