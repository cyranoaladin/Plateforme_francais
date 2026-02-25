import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('mcpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ id: 'student-123', plan: 'MONTHLY' }),
            },
          ],
        },
      }),
    })
  })

  it('calls MCP endpoint with auth header', async () => {
    process.env.MCP_SERVER_URL = 'http://localhost:3100'
    process.env.MCP_API_KEY = 'test-key'

    const { getMcpClient } = await import('@/lib/mcp/client')
    const client = getMcpClient()
    const result = await client.student.getProfile('student-123', 'diagnosticien')

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3100/mcp',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(result).toEqual({ id: 'student-123', plan: 'MONTHLY' })
  })

  it('injects agentSkill in meta', async () => {
    const { getMcpClient } = await import('@/lib/mcp/client')
    const client = getMcpClient()

    await client.rag.search('test', {}, 'rag-librarian')

    const secondArg = mockFetch.mock.calls[0][1] as { body?: string }
    const body = JSON.parse(secondArg.body ?? '{}') as {
      params?: { arguments?: { _meta?: { agentSkill?: string } } }
    }

    expect(body.params?.arguments?._meta?.agentSkill).toBe('rag-librarian')
  })

  it('throws on MCP error payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        error: { code: -32601, message: 'Outil inconnu' },
      }),
    })

    const { getMcpClient } = await import('@/lib/mcp/client')
    const client = getMcpClient()

    await expect(
      client.callTool('eaf_get_student_profile', {}, { agentSkill: 'system' }),
    ).rejects.toThrow('Outil inconnu')
  })
})
