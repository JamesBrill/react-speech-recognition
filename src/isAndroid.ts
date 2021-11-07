export default () => /(android)/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '')
