import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

// The frame around every public/client page: navbar on top, footer at
// the bottom. <Outlet /> is where React Router puts the current page.
export default function SiteLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
