import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch } from './apiFetch'

function mockResponse({ ok, status, body = '' }) {
  return Promise.resolve({
    ok,
    status,
    text: async () => body,
  })
}

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('returns parsed JSON on a successful response', async () => {
    global.fetch.mockReturnValue(mockResponse({ ok: true, status: 200, body: '{"id":1}' }))

    const result = await apiFetch('http://api/test', 'my-token')

    expect(result).toEqual({ id: 1 })
  })

  it('returns null when the response body is empty (e.g. 201 No Content)', async () => {
    global.fetch.mockReturnValue(mockResponse({ ok: true, status: 201, body: '' }))

    const result = await apiFetch('http://api/test', 'my-token')

    expect(result).toBeNull()
  })

  it('attaches the Authorization header on every request', async () => {
    global.fetch.mockReturnValue(mockResponse({ ok: true, status: 200, body: '{}' }))

    await apiFetch('http://api/test', 'tok-abc')

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api/test',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok-abc' }),
      })
    )
  })

  it('throws "Session expired" on 403', async () => {
    global.fetch.mockReturnValue(mockResponse({ ok: false, status: 403 }))

    await expect(apiFetch('http://api/test', 'token')).rejects.toThrow('Session expired')
  })

  it('throws "Request failed" with the status code on other non-ok responses', async () => {
    global.fetch.mockReturnValue(mockResponse({ ok: false, status: 500 }))

    await expect(apiFetch('http://api/test', 'token')).rejects.toThrow('Request failed: 500')
  })

  it('merges caller-provided options with the Authorization header', async () => {
    global.fetch.mockReturnValue(mockResponse({ ok: true, status: 200, body: '{}' }))

    await apiFetch('http://api/test', 'tok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'Content-Type': 'application/json',
        }),
      })
    )
  })
})
