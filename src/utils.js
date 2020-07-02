const debounce = (func, wait, immediate) => {
  let timeout
  return function() {
    const context = this
    const args = arguments
    const later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

const concatTranscripts = (...transcriptParts) => {
  return transcriptParts.map(t => t.trim()).join(' ').trim()
}

// The command matching code is a modified version of Backbone.Router by Jeremy Ashkenas, under the MIT license.
const optionalParam = /\s*\((.*?)\)\s*/g
const optionalRegex = /(\(\?:[^)]+\))\?/g
const namedParam = /(\(\?)?:\w+/g
const splatParam = /\*\w+/g
const escapeRegExp = /[-{}[\]+?.,\\^$|#]/g
const commandToRegExp = (command) => {
  command = command
    .replace(escapeRegExp, '\\$&')
    .replace(optionalParam, '(?:$1)?')
    .replace(namedParam, (match, optional) => {
      return optional ? match : '([^\\s]+)'
    })
    .replace(splatParam, '(.*?)')
    .replace(optionalRegex, '\\s*$1?\\s*')
  return new RegExp('^' + command + '$', 'i')
}

export { debounce, concatTranscripts, commandToRegExp }
