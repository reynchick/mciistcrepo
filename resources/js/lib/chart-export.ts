export async function toPngDataUrl(node: HTMLElement): Promise<string> {
  const rect = node.getBoundingClientRect()
  const w = Math.ceil(rect.width || 800)
  const h = Math.ceil(rect.height || 400)
  const clone = node.cloneNode(true) as HTMLElement
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  const html = new XMLSerializer().serializeToString(clone)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)
  return canvas.toDataURL('image/png')
}

export async function exportNodeAsPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPngDataUrl(node)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}