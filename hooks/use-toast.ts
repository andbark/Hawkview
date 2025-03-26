// Simplified toast utility for the build
export function useToast() {
  return {
    toast: (opts: any) => {
      console.log('Toast:', opts)
    }
  }
}

export const toast = (opts: any) => {
  console.log('Toast:', opts)
}
