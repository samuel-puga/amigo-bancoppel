/// <reference types="vite/client" />

declare module "*.mp4" {
  const src: string
  export default src
}

import "react-native"

declare module "react-native" {
  namespace StyleSheet {
    export const absoluteFillObject: any
  }
}

