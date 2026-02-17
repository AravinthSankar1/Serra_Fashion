import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CollectionPage from './pages/CollectionPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCategories from './pages/admin/Categories';
import AdminBrands from './pages/admin/Brands';
import AdminProducts from './pages/admin/Products';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminPromos from './pages/admin/Promos';
import AdminSizeGuides from './pages/admin/SizeGuides';
import AdminBanners from './pages/admin/Banners';



function App() {
    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/men" element={<CollectionPage title="Men's Essentials" gender="MEN" />} />
                    <Route path="/women" element={<CollectionPage title="Women's Collection" gender="WOMEN" />} />
                    <Route path="/sale" element={<CollectionPage title="Special Offers" isSale={true} />} />
                    <Route path="/new" element={<CollectionPage title="New Arrivals" />} />
                    <Route path="/search" element={<CollectionPage title="Search Results" />} />
                    <Route path="/collection" element={<CollectionPage title="Full Collection" />} />
                    <Route path="/product/:slug" element={<ProductDetailsPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                    {/* Admin Routes */}
                    <Route element={<ProtectedAdminRoute />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="categories" element={<AdminCategories />} />
                            <Route path="brands" element={<AdminBrands />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="promos" element={<AdminPromos />} />
                            <Route path="size-guides" element={<AdminSizeGuides />} />
                            <Route path="banners" element={<AdminBanners />} />
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </>
    );
}

export default App;
