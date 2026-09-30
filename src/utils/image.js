// Shrinks a photo picked by the user to a small JPEG (as text) so reports
// can be saved in the browser without filling its storage. Returns null
// if the file is not a readable image.
export function resizeImage(file, maxSize = 480) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}
