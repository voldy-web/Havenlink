import HeroSearch from './HeroSearch'
import FeaturedProperties from './FeaturedProperties'
import HowItWorks from './HowItWorks'
import Ecosystem from './Ecosystem'
import Testimonials from './Testimonials'
import AppBanner from './AppBanner'

// The Home page is just its sections stacked in order.
export default function Home() {
  return (
    <>
      <HeroSearch />
      <FeaturedProperties />
      <HowItWorks />
      <Ecosystem />
      <Testimonials />
      <AppBanner />
    </>
  )
}
