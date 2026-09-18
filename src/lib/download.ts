/** Save a text file: share sheet on iOS when available, otherwise a download link. */
export async function saveTextFile(name: string, text: string, type = 'application/json'): Promise<'shared' | 'downloaded'> {
  const blob = new Blob([text], { type })
  const file = new File([blob], name, { type })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name })
      return 'shared'
    } catch {
      /* user cancelled or share failed; fall back */
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
