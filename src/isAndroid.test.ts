import isAndroid from './isAndroid'

const mockUserAgent = (userAgent) => {
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, writable: true })
}

const mockUndefinedNavigator = () => {
  Object.defineProperty(global, 'navigator', { value: undefined, writable: true })
}

describe('isAndroid', () => {
  test('returns false when navigator.userAgent does not contain android string', () => {
    mockUserAgent('safari browser')
    const result = isAndroid()

    expect(result).toEqual(false)
  })

  test('returns true when navigator.userAgent contains android string', () => {
    mockUserAgent('android browser')
    const result = isAndroid()

    expect(result).toEqual(true)
  })

  test('returns false when navigator is undefined', () => {
    mockUndefinedNavigator()
    const result = isAndroid()

    expect(result).toEqual(false)
  })
})
