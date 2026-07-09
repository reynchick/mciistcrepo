export async function downloadFromUrl(url: string, filename: string) {
  const res = await fetch(url)
  await downloadResponse(res, filename)
}

export async function downloadResponse(res: Response, filename: string) {
  const blob = await res.blob()
  await downloadBlob(blob, filename)
}

export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}