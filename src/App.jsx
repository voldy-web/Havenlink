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
import RequireAuth from './components/RequireAuth'
import Orders from './pages/Orders/Orders'
import Viewings from './pages/Viewings/Viewings'
import Settings from './pages/Settings/Settings'
import Messages from './pages/Messages/Messages'
import PortalLayout from './components/layout/PortalLayout'
import PostProperty from './pages/Owner/PostProperty'
import OwnerListings from './pages/Owner/OwnerListings'
import OwnerViewings from './pages/Owner/OwnerViewings'
import ListingForm from './pages/Owner/ListingForm'
import OwnerTenancies from './pages/Owner/OwnerTenancies'
import OwnerRepairs from './pages/Owner/OwnerRepairs'
import MyTenancy from './pages/Tenancy/MyTenancy'
import AdminQueue from './pages/Admin/AdminQueue'
import AdminReview from './pages/Admin/AdminReview'
import Payments from './pages/Payments/Payments'
import Help from './pages/Info/Help'
import Legal from './pages/Info/Legal'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import NotFound from './pages/NotFound/NotFound'

// Sidebar links for the owner and admin areas.
const ownerLinks = [
  { to: '/owner', label: 'My listings', icon: 'home', end: true },
  { to: '/owner/viewings', label: 'Viewing requests', icon: 'calendar', badge: 'viewings' },
  { to: '/owner/tenancies', label: 'Tenancies', icon: 'key' },
  { to: '/owner/repairs', label: 'Repairs', icon: 'wrench', badge: 'repairs' },
  { to: '/owner/messages', label: 'Messages', icon: 'chat', badge: 'messages' },
  { to: '/owner/new', label: 'Post a property', icon: 'plus' },
  { to: '/owner/settings', label: 'Settings', icon: 'user' },
]
const adminLinks = [
  { to: '/admin', label: 'Listing review', icon: 'shield', end: true },
  { to: '/admin/settings', label: 'Settings', icon: 'user' },
]

// The route table: which URL shows which page.
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/new" element={<PostProperty />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/properties/:id/book" element={<RequireAuth><BookViewing /></RequireAuth>} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ProviderProfile />} />
        <Route path="/services/:id/pay" element={<RequireAuth><ProviderPay /></RequireAuth>} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Logged-in pages share the dashboard sidebar. */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/saved" element={<SavedHomes />} />
          <Route path="/tenancy" element={<MyTenancy />} />
          <Route path="/reports" element={<MyReports />} />
          <Route path="/reports/new" element={<ReportProblem />} />
          <Route path="/viewings" element={<Viewings />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/owner" element={<PortalLayout role="owner" links={ownerLinks} />}>
          <Route index element={<OwnerListings />} />
          <Route path="viewings" element={<OwnerViewings />} />
          <Route path="tenancies" element={<OwnerTenancies />} />
          <Route path="repairs" element={<OwnerRepairs />} />
          <Route path="messages" element={<Messages base="/owner/messages" canStart={false} />} />
          <Route path="messages/:id" element={<Messages base="/owner/messages" canStart={false} />} />
          <Route path="new" element={<ListingForm />} />
          <Route path=":id/edit" element={<ListingForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/admin" element={<PortalLayout role="admin" links={adminLinks} />}>
          <Route index element={<AdminQueue />} />
          <Route path=":id" element={<AdminReview />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/help" element={<Help />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
