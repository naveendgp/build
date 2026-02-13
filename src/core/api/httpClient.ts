import { cookies } from 'next/headers'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
    method?: HttpMethod
    body?: unknown
    headers?: Record<string, string>
    cache?: RequestCache
}

export class HttpClientError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message)
        this.name = 'HttpClientError'
    }
}

function nestUrl(path: string): string {
    const base = process.env.NEST_INTERNAL_URL
    if (!base) throw new HttpClientError(500, 'NEST_INTERNAL_URL not configured')
    return `${base}${path}`
}

export async function httpClient<T>(
    path: string,
    options: RequestOptions = {}
): Promise<T> {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (!token) {
        throw new HttpClientError(401, 'Missing admin session')
    }

    const res = await fetch(nestUrl(path), {
        method: options.method ?? 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: options.cache ?? 'no-store',
    })

    if (!res.ok) {
        const text = await res.text()
        console.error(`[httpClient] ${options.method ?? 'GET'} ${path} → ${res.status}: ${text}`)

        throw new HttpClientError(
            res.status,
            res.status === 401
                ? 'Unauthenticated'
                : res.status === 403
                    ? 'Forbidden'
                    : 'Internal server error'
        )
    }

    return res.json()
}


export async function httpClientAnonymous<T>(
    path: string,
    options: Omit<RequestOptions, 'headers'> = {}
): Promise<T> {
    const res = await fetch(nestUrl(path), {
        method: options.method ?? 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: options.cache ?? 'no-store',
    })

    if (!res.ok) {
        const text = await res.text()
        console.error(`[httpClientAnonymous] ${options.method ?? 'POST'} ${path} → ${res.status}: ${text}`)

        throw new HttpClientError(res.status, 'Request failed')
    }

    return res.json()
}
