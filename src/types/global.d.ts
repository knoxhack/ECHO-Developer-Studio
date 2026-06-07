import type { EchoAPI } from '../preload'

declare global {
  interface Window {
    echoAPI: EchoAPI
  }
}
