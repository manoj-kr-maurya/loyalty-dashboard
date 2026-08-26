import axios, { AxiosError } from 'axios'

const API_KEY = import.meta.env.VITE_API_KEY || 'gyhewd8x34y87ddsyn9738t94587rfybds09t478fts7ndyr7yfd0gyn7t'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) return data!.message.join(', ')
    if (typeof data?.message === 'string') return data.message
    return error.message
  }
  return error instanceof Error ? error.message : 'Unknown error'
}

export async function request<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await api.request<T>({ method, url, data: body })
  return res.data
}

export default api
