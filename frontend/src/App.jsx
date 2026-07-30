import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import Chatbot from "./components/Chatbot";
import InstallPrompt from "./components/InstallPrompt";

// User Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
import Support from "./pages/Support";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminSupport from "./pages/AdminSupport";

import ToastContainer from "./components/ToastContainer";

// Wrapper to conditionally show Navbar/Footer only on user routes
function AppContent() {
  const location = useLocation();

  // Admin routes don't use the main Navbar/Footer
  const isAdminRoute =
    location.pathname.startsWith("/admin-dashboard") ||
    location.pathname.startsWith("/admin-orders") ||
    location.pathname.startsWith("/admin-settings") ||
    location.pathname.startsWith("/admin-support") ||
    location.pathname === "/admin" ||
    location.pathname === "/admin-login";

  return (
    <>
      <ToastContainer />
      {!isAdminRoute && <InstallPrompt />}
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <Chatbot />}

      <Routes>
        {/* ─── Public User Routes ─── */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/support" element={<Support />} />

        {/* ─── Dedicated Admin Login (no Navbar/Footer) ─── */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ─── Protected Admin Routes (with AdminLayout sidebar) ─── */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin-orders"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout>
                <Admin />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin-settings"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin-support"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSupport />
              </AdminLayout>
            </AdminRoute>
          }
        />
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;