import { Routes, Route } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import Home from './pages/Home/Home'
import Properties from './pages/Properties/Properties'
import PropertyDetail from './pages/PropertyDetail/PropertyDetail'
import BookViewing from './pages/BookViewing/BookViewing'
import Services from './pages/Services/Services'
import ProviderProfile from './pages/ProviderProfile/ProviderProfile'
import ProviderPay from './pages/ProviderPay/ProviderPay'
import Shop from './pages/Shop/Shop'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import Cart from './pages/Cart/Cart'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import SavedHomes from './pages/SavedHomes/SavedHomes'
import ReportProblem from './pages/ReportProblem/ReportProblem'
import MyReports from './pages/MyReports/MyReports'
import Auth from './pages/Auth/Auth'
import Orders from './pages/Orders/Orders'
import Viewings from './pages/Viewings/Viewings'
import ComingSoon from './pages/ComingSoon/ComingSoon'
import NotFound from './pages/NotFound/NotFound'

// The route table: which URL shows which page.
// Pages not built yet use <ComingSoon /> until their step comes up.
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/new" element={<ComingSoon title="Post a Property" />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/properties/:id/book" element={<BookViewing />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ProviderProfile />} />
        <Route path="/services/:id/pay" element={<ProviderPay />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        {/* Logged-in pages share the dashboard sidebar. */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/saved" element={<SavedHomes />} />
          <Route path="/reports" element={<MyReports />} />
          <Route path="/reports/new" element={<ReportProblem />} />
          <Route path="/viewings" element={<Viewings />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/messages" element={<ComingSoon title="Messages" />} />
        </Route>
        <Route path="/help" element={<ComingSoon title="Help Center" />} />
        <Route path="/terms" element={<ComingSoon title="Terms of Service" />} />
        <Route path="/privacy" element={<ComingSoon title="Privacy Statement" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
