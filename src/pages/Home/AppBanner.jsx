import './AppBanner.css'

// Green promo banner. There is no mobile app yet, so it says
// "coming soon" and the store buttons are disabled.
export default function AppBanner() {
  return (
    <section className="container">
      <div className="app-banner">
        <div>
          <span className="app-banner__tag">Mobile app coming soon</span>
          <h2>Living Made Effortless.</h2>
          <p>
            Book viewings, report problems, call a trusted plumber and track
            your orders, all from your pocket.
          </p>
          <div className="app-banner__stores">
            <button disabled>App Store</button>
            <button disabled>Google Play</button>
          </div>
        </div>
      </div>
    </section>
  )
}
