export interface CustomHookParameter {
  transcribing?: boolean
  clearTranscriptOnListen?: boolean
  commands?: {
    command: any,
    callback: any,
    matchInterim: boolean
    isFuzzyMatch: boolean
    fuzzyMatchingThreshold: number
  }[]
}
export interface StartListeningParameter {
  continuous?: boolean,
  language?: string
}

export type DisconnectType = 'ABORT' | 'RESET' | 'STOP'

export interface CallbacksType {
  onListeningChange: React.Dispatch<React.SetStateAction<boolean>>,
  onTranscriptChange: Function,
  onClearTranscript: Function
}
