const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''

export default () => /(android)/i.test(userAgent)
