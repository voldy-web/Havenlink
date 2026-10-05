// Shrinks a photo in the browser before it is uploaded: at most 1600 px on the long side,
// saved as a JPEG under about 600 KB. Phone photos are often 5 MB or more, so this keeps
// uploads fast and the database small.
const MAX_SIDE = 1600
const MAX_BYTES = 600_000

export async function resizeToDataUrl(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Please choose a JPEG, PNG or WebP photo.')
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('That file could not be read as a photo.')
  }
  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff' // transparent PNGs get a white background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.85, 0.75, 0.65, 0.55]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (dataUrl.length * 0.75 <= MAX_BYTES) return dataUrl
    }
    scale *= 0.8
  }
  throw new Error('That photo is too large. Please choose a smaller one.')
}
