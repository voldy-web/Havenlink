// Small helpers for products that have options (finish, size, layout...).

// The first choice of every option group, used when adding from the catalog.
export function defaultChoices(product) {
  const choices = {}
  ;(product.options || []).forEach((group) => {
    choices[group.name] = group.choices[0].label
  })
  return choices
}

// Base price plus the extra cost of each chosen option.
export function unitPriceFor(product, choices) {
  const extras = (product.options || []).reduce((sum, group) => {
    const picked = group.choices.find((c) => c.label === choices[group.name])
    return sum + (picked ? picked.extra : 0)
  }, 0)
  return product.price + extras
}

// Colours for options that are shown as round swatches.
export const swatchColors = {
  'Warm Oat': '#e6dccb',
  'Stone Grey': '#8a8f94',
  'Forest Green': '#2f4a3a',
  Terracotta: '#b35a2e',
}
