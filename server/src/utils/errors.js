// An error we expect and can explain to the person using the site.
export class HttpError extends Error {
  constructor(status, message, fields, code) {
    super(message)
    this.status = status
    this.fields = fields
    this.code = code // a short word the website can react to, for example 'no_account'
  }
}

// Throws a 400 listing every field that failed. `fields` maps a field name to
// an error message, or to null when that field is fine.
export function failIfInvalid(fields) {
  const failed = Object.fromEntries(Object.entries(fields).filter(([, message]) => message))
  if (Object.keys(failed).length) throw new HttpError(400, 'Please check your details and try again.', failed)
}
