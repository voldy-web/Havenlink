// One place that finds every photo used on the site.
//
// HOW TO USE YOUR OWN SHARPER PHOTOS: save a photo into src/assets/photos/
// with the SAME NAME as the placeholder in src/assets/mock/ (for example
// property-villa.jpg) and it is used automatically. No code changes needed.
// See src/assets/photos/README.md for the list of names and sizes.
const custom = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })
const placeholders = import.meta.glob('../assets/mock/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })

// Finds "<folder>/<name>.<extension>" in a glob result.
const find = (files, name) => {
  const key = Object.keys(files).find((k) => /\/([^/]+)\.[a-z]+$/.exec(k)?.[1] === name)
  return key ? files[key] : undefined
}

export function photo(name) {
  return find(custom, name) ?? find(placeholders, name)
}
