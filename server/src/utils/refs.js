import { randomInt } from 'node:crypto'

// Short reference numbers people can quote, like HL-R-483920.
export const REF_PATTERN = /^HL-[VROS]-\d{6}$/
export const makeRef = (prefix) => `HL-${prefix}-${randomInt(100000, 1000000)}`

// Runs `insert(reference)` with a fresh reference, trying again in the rare
// case two records draw the same number.
export async function insertWithRef(prefix, insert) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await insert(makeRef(prefix))
    } catch (err) {
      if (err.code === '23505' && err.constraint?.endsWith('_reference_key')) continue
      throw err
    }
  }
  throw new Error('Could not create a unique reference number.')
}
