/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, MapPin, PlusCircle, LayoutDashboard, Users, LogIn, X } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, OrganizationSwitcher, useUser, useAuth } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import AdminPage from './pages/AdminPage';
import CommunityFeedPage from './pages/CommunityFeedPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import Chatbot from './components/Chatbot';

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`font-medium transition-colors ${isActive
        ? 'text-emerald-600'
        : 'text-stone-600 hover:text-stone-900'
        }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex flex-col items-center transition-colors ${isActive ? 'text-emerald-600' : 'text-stone-400 hover:text-emerald-600'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  );
}

// Protected Admin Route Component
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { orgRole } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // If not signed in at all, prompt to sign in
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // If signed in, but not an admin in the organization (Clerk uses "org:admin")
  // Or handle standard user roles if orgs are not configured
  // For basic RBAC without orgs, we could check a publicMetaData field `user.publicMetadata.role === 'admin'`
  // Let's check orgRole first, fallback to user metadata
  const isAdmin = orgRole === 'org:admin' || user.publicMetadata.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Access Denied</h2>
        <p className="text-stone-500 max-w-md mx-auto mb-8">
          You do not have administrative privileges to view this page. If you believe this is an error, please contact the system administrator.
        </p>
        <Link to="/" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-stone-200/60 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 text-emerald-600 font-bold text-xl tracking-tight shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span>Smart Civic System</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 ml-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/report">Report Issue</NavLink>
              <NavLink to="/community">Community</NavLink>
              <NavLink to="/my-complaints">My Complaints</NavLink>
              <NavLink to="/admin">Admin</NavLink>
            </nav>

            {/* Right side: Auth controls */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <SignedOut>
                <SignInButton mode="modal">
                  {/* Full button on desktop, compact on mobile */}
                  <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-xl font-medium transition-all text-sm">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="hidden sm:block">
                  <OrganizationSwitcher hidePersonal={true} />
                </div>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/community" element={<CommunityFeedPage />} />
            <Route path="/my-complaints" element={<MyComplaintsPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPage />
                </ProtectedAdminRoute>
              }
            />
            <Route path="/complaint/:id" element={<ComplaintDetailPage />} />
          </Routes>
        </main>

        {/* AI Chatbot */}
        <Chatbot />

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-stone-200/60 flex justify-around px-2 py-2 pb-safe z-30">
          <MobileNavLink to="/" icon={Home} label="Home" />
          <MobileNavLink to="/report" icon={PlusCircle} label="Report" />
          <MobileNavLink to="/community" icon={Users} label="Feed" />
          <MobileNavLink to="/my-complaints" icon={MapPin} label="Status" />
          <MobileNavLink to="/admin" icon={LayoutDashboard} label="Admin" />
        </nav>
      </div>
    </Router>
  );
}
