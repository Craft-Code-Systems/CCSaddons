// tests/getDateAndTime.test.ts
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getDateAndTime } from '../src/lib/utils'  // adjust path to your file

describe('getDateAndTime()', () => {
  beforeAll(() => {
    // Freeze time at 2021-01-02 03:04:05
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2021, 0, 2, 3, 4, 5))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('returns the date/time formatted as DD-MM-YYYY HH:MM:SS', () => {
    expect(getDateAndTime()).toBe('02-01-2021 03:04:05')
  })

  it('throws if the Date constructor throws', () => {
    // Stub global.Date to throw on construction
    const OriginalDate = global.Date
    // @ts-ignore
    global.Date = class {
      constructor() { throw new Error('broken') }
    }

    expect(() => getDateAndTime()).toThrow('broken')

    // Restore real Date
    global.Date = OriginalDate
  })
})
