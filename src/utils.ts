const debounce = (
  func: Function,
  wait: number,
  immediate: boolean
): ((newFinalTranscript: string) => void) => {
  let timeout: number | undefined;
  return function () {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = undefined;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const concatTranscripts = (...transcriptParts: string[]): string => {
  return transcriptParts.map(t => t.trim()).join(' ').trim()
}

// The command matching code is a modified version of Backbone.Router by Jeremy Ashkenas, under the MIT license.
const optionalParam = /\s*\((.*?)\)\s*/g
const optionalRegex = /(\(\?:[^)]+\))\?/g
const namedParam = /(\(\?)?:\w+/g
const splatParam = /\*/g
const escapeRegExp = /[-{}[\]+?.,\\^$|#]/g
const commandToRegExp = (command: RegExp | string): RegExp => {
  if (command instanceof RegExp) {
    return new RegExp(command.source, 'i')
  }
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

// this is from https://github.com/aceakash/string-similarity
const compareTwoStringsUsingDiceCoefficient = (first: string, second: string): number => {
  first = first.replace(/\s+/g, '').toLowerCase()
  second = second.replace(/\s+/g, '').toLowerCase()

  if (!first.length && !second.length) return 1 // if both are empty strings
  if (!first.length || !second.length) return 0 // if only one is empty string
  if (first === second) return 1 // identical
  if (first.length === 1 && second.length === 1) return 0 // both are 1-letter strings
  if (first.length < 2 || second.length < 2) return 0 // if either is a 1-letter string

  const firstBigrams = new Map()
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first.substring(i, i + 2)
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1

    firstBigrams.set(bigram, count)
  }

  let intersectionSize = 0
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second.substring(i, i + 2)
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0

    if (count > 0) {
      firstBigrams.set(bigram, count - 1)
      intersectionSize++
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2)
}

export { debounce, concatTranscripts, commandToRegExp, compareTwoStringsUsingDiceCoefficient }
