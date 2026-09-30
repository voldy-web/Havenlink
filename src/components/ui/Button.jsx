import { Link } from 'react-router-dom'
import './Button.css'

// Reusable button. Pass `to` to render a link (page navigation),
// otherwise it renders a normal <button>.
// variant: "primary" (solid green) | "secondary" (soft) | "outline"
export default function Button({
  children,
  to,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) {
  const classes = `btn btn--${variant} btn--${size} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
