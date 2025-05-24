// tests/loggingFunctions.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Stub getDateAndTime before importing the module under test
vi.mock('../src/lib/utils', () => ({
  getDateAndTime: vi.fn(() => 'FIXED_DATE')
}))
import { sndMsgConsole } from '../src/functions'

describe('sndMsgConsole', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    // Spy on console
    logSpy   = vi.spyOn(console, 'log'  ).mockImplementation(() => {})
    warnSpy  = vi.spyOn(console, 'warn' ).mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Stub fetch
    fetchMock = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('type=0: logs only short message, no HTTP calls', async () => {
    await sndMsgConsole('Page', 'Func', 'Msg', 0, false, false, '')
    expect(logSpy).toHaveBeenCalledWith('[Page]_[Func]_msg: Msg')
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('type=1: console.error + API POST', async () => {
    await sndMsgConsole('P', 'F', 'M', 1, false, false, '')

    // console.error called
    expect(errorSpy).toHaveBeenCalledWith('[P]_[F]_msg: M')

    // one fetch call for API
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [apiUrl, apiConf] = fetchMock.mock.calls[0]
    expect(apiUrl).toBe('https://api.instantwms.com/v0/logging')
    expect(apiConf.method).toBe('POST')
    expect(apiConf.headers).toEqual({ 'Content-Type': 'application/json' })

    // parse and assert JSON body
    const apiBody = JSON.parse(apiConf.body as string)
    expect(apiBody.logData).toContain('FIXED_DATE')
    expect(apiBody.logMode).toBe(1)
    expect(apiBody.logDebug).toBe(false)
  })

  it('type=1 + slackHook: POSTs to Slack then API', async () => {
    const hook = 'https://hooks.slack.com/test'
    await sndMsgConsole('X', 'Y', 'Z', 1, false, false, hook)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [slackUrl, slackConf] = fetchMock.mock.calls[0]
    expect(slackUrl).toBe(hook)
    expect(slackConf.method).toBe('POST')
    // Slack payload
    const slackBody = JSON.parse(slackConf.body as string)
    expect(slackBody).toEqual({ text: expect.stringContaining('FIXED_DATE') })

    // API payload
    const [apiUrl, apiConf] = fetchMock.mock.calls[1]
    expect(apiUrl).toBe('https://api.instantwms.com/v0/logging')
    const apiBody = JSON.parse(apiConf.body as string)
    expect(apiBody.logData).toContain('FIXED_DATE')
    expect(apiBody.logMode).toBe(1)
    expect(apiBody.logDebug).toBe(false)
  })

  it('type=2 debug=false: console.warn only, no HTTP', async () => {
    await sndMsgConsole('pg', 'fn', 'ms', 2, false, false, '')
    expect(warnSpy).toHaveBeenCalledWith('[pg]_[fn]_msg: ms')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('type=2 debug=true: console.warn + API POST', async () => {
    await sndMsgConsole('pg', 'fn', 'ms', 2, false, true, '')

    expect(warnSpy).toHaveBeenCalledWith('[pg]_[fn]_msg: ms')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [apiUrl, apiConf] = fetchMock.mock.calls[0]
    const apiBody = JSON.parse(apiConf.body as string)
    expect(apiUrl).toBe('https://api.instantwms.com/v0/logging')
    expect(apiBody.logData).toContain('FIXED_DATE')
    expect(apiBody.logMode).toBe(2)
    expect(apiBody.logDebug).toBe(true)
  })

  it('type=3 debug=false: console.log only, no HTTP', async () => {
    await sndMsgConsole('A', 'B', 'C', 3, false, false, '')
    expect(logSpy).toHaveBeenCalledWith('[A]_[B]_msg: C')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('type=3 debug=true: console.log + API POST', async () => {
    await sndMsgConsole('A', 'B', 'C', 3, false, true, '')

    expect(logSpy).toHaveBeenCalledWith('[A]_[B]_msg: C')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [apiUrl, apiConf] = fetchMock.mock.calls[0]
    const apiBody = JSON.parse(apiConf.body as string)
    expect(apiUrl).toBe('https://api.instantwms.com/v0/logging')
    expect(apiBody.logData).toContain('FIXED_DATE')
    expect(apiBody.logMode).toBe(3)
    expect(apiBody.logDebug).toBe(true)
  })
})
