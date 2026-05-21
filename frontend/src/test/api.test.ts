import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { chatCompletion, ApiError, type ChatCompletionOptions } from '@/lib/api'

describe('ApiError', () => {
  it('创建实例包含 status 和 body', () => {
    const err = new ApiError('请求失败', 400, '{"error":"bad request"}')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.name).toBe('ApiError')
    expect(err.message).toBe('请求失败')
    expect(err.status).toBe(400)
    expect(err.body).toBe('{"error":"bad request"}')
  })

  it('status 和 body 可选', () => {
    const err = new ApiError('超时')
    expect(err.status).toBeUndefined()
    expect(err.body).toBeUndefined()
  })
})

describe('chatCompletion', () => {
  const baseOptions: ChatCompletionOptions = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test-key',
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'hello' }],
  }

  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('成功调用返回 content', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '你好！' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const result = await chatCompletion(baseOptions)
    expect(result).toBe('你好！')
  })

  it('移除 baseUrl 尾部斜杠后拼接 /chat/completions', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 })
    )

    await chatCompletion({ ...baseOptions, baseUrl: 'https://api.openai.com/v1/' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.anything()
    )
  })

  it('401 返回 ApiError 含密钥无效提示', async () => {
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }))

    await expect(chatCompletion(baseOptions)).rejects.toThrow('API 密钥无效或没有权限')
    await expect(chatCompletion(baseOptions)).rejects.toMatchObject({ status: 401 })
  })

  it('403 返回 ApiError 含密钥无效提示', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Forbidden', { status: 403 }))

    await expect(chatCompletion(baseOptions)).rejects.toThrow('API 密钥无效或没有权限')
  })

  it('429 返回 ApiError 含限流提示', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Too Many', { status: 429 }))

    await expect(chatCompletion(baseOptions)).rejects.toThrow('请求过于频繁')
  })

  it('其他错误状态码返回通用错误信息', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"error":"server error"}', { status: 500 })
    )

    await expect(chatCompletion(baseOptions)).rejects.toThrow('API 请求失败 (500)')
  })

  it('返回空 choices 返回空字符串', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [] }), { status: 200 })
    )

    const result = await chatCompletion(baseOptions)
    expect(result).toBe('')
  })

  it('传递 AbortSignal', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 })
    )

    await chatCompletion({ ...baseOptions, signal: new AbortController().signal })
    const callOptions = fetchMock.mock.calls[0][1] as RequestInit
    expect(callOptions.signal).toBeInstanceOf(AbortSignal)
  })
})
