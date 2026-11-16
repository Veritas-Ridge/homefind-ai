import React, { useState, useEffect } from 'react';

// GA4 initialization
if (typeof window !== 'undefined' && !window.gtagLoaded) {
  window.gtagLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DP4XXP5DQW';
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-DP4XXP5DQW');
}
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Home, Heart, LayoutDashboard, LogOut, User, Menu, X, Search, TrendingUp, Phone,
  ExternalLink, Instagram, Facebook, Youtube, Linkedin, MapPin,
} from 'lucide-react';

import MortgageRateTicker from '@/components/MortgageRateTicker';
import BrandLogo from '@/components/BrandLogo';
import { LEAD_PATHS, TEAM, SOCIAL, MAIN_SITE } from '@/lib/brand';

// The search tool lives on a subdomain of crandellrealestate.com. Header and
// footer mirror the main site (same nav, palette, pill buttons) so moving
// between the two reads as one website.
const SOCIAL_ICONS = { Instagram, Facebook, YouTube: Youtube, LinkedIn: Linkedin, 'Google Maps': MapPin };

// Pages with their own sticky mobile action bar hide the rate ticker on
// phones so the two fixed bars don't stack.
const HIDE_TICKER_ON_MOBILE = ['PropertyDetail'];

export default function Layout({ children, currentPageName }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Redirect new users to onboarding if they haven't completed it yet.
  // Skip the redirect if they're already on the Onboarding or Login page.
  useEffect(() => {
    if (
      user &&
      !user.has_completed_onboarding &&
      user.role !== 'admin' &&
      user.is_user_admin !== true &&
      currentPageName !== 'Onboarding' &&
      currentPageName !== 'Login'
    ) {
      navigate('/Onboarding');
    }
  }, [user, currentPageName, navigate]);

  // Search is available to everyone (anonymous browsing is critical for an
  // IDX site — Zillow/Redfin let buyers search before any sign-in). Saved
  // Homes stays gated because saving genuinely requires an account.
  const mainNavLinks = [
    { name: 'Home', path: 'Home', icon: Home, show: true },
    { name: 'Search Homes', path: 'Search', icon: Search, show: true },
    { name: 'Saved Homes', path: 'SavedProperties', icon: Heart, show: !!user },
  ];

  const isAdmin = user?.role === 'admin' || user?.is_user_admin === true;

  const adminLinks = [
    { name: 'Admin Dashboard', path: 'AdminDashboard', icon: LayoutDashboard },
    { name: 'Market Pulse', path: 'MarketPulse', icon: TrendingUp },
    { name: 'Manage Users', path: 'ManageUsers', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="bg-[rgba(255,253,248,0.96)] backdrop-blur border-b border-border sticky top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="crandell-container">
          <div className="flex justify-between items-center gap-4 h-16 md:h-[72px]">
            <Link to={createPageUrl('Home')} className="flex items-center hover:opacity-90 transition-opacity" aria-label="Crandell Real Estate Team home">
              <BrandLogo />
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
              {mainNavLinks.filter(link => link.show && link.path !== 'Home').map((link) => {
                const isActive = currentPageName === link.path;
                return (
                  <Link
                    key={link.path}
                    to={createPageUrl(link.path)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-2 text-sm font-bold rounded-full transition-colors select-none ${
                      isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              {LEAD_PATHS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-bold text-foreground hover:text-primary transition-colors select-none"
                >
                  {link.name}
                </a>
              ))}
              <a href={TEAM.phoneTel} className="ml-2 px-2 py-2 text-sm font-extrabold text-primary hover:underline underline-offset-4">
                {TEAM.phoneDisplay}
              </a>
            </nav>

            {/* Right side: account + Contact Us, menu on smaller screens */}
            <div className="flex items-center gap-2">
              {!user && (
                <Link to="/Login">
                  <Button variant="brandOutline" size="sm" className="select-none md:h-9 md:px-4 md:text-sm">
                    Sign in
                  </Button>
                </Link>
              )}
              <a href={TEAM.contact} className="hidden sm:block">
                <Button variant="brandBlue" className="select-none h-9 md:h-10">Contact Us</Button>
              </a>
              <button
                className={`p-2 rounded-full hover:bg-muted transition-colors ${user ? '' : 'lg:hidden'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu panel */}
        {mobileMenuOpen && (
          <div className="border border-border bg-card absolute right-2 top-full mt-2 w-72 shadow-[var(--crandell-shadow-lg)] rounded-[18px] z-50">
            <div className="px-3 py-3 space-y-1">
              {/* Small screens: main nav lives here */}
              <div className="lg:hidden space-y-1 mb-2">
                {mainNavLinks.filter(link => link.show).map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.path} to={createPageUrl(link.path)} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
                        <Icon className="h-4 w-4" />
                        {link.name}
                      </Button>
                    </Link>
                  );
                })}
                {LEAD_PATHS.map((link) => (
                  <a key={link.href} href={link.href}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
                      <ExternalLink className="h-4 w-4" />
                      {link.name}
                    </Button>
                  </a>
                ))}
                <a href={TEAM.phoneTel}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                    <Phone className="h-4 w-4" />
                    {TEAM.phoneDisplay}
                  </Button>
                </a>
                <a href={TEAM.contact} className="block sm:hidden px-1 pt-1">
                  <Button variant="brandBlue" className="w-full">Contact Us</Button>
                </a>
                {user && <div className="border-t border-border my-2" />}
              </div>

              {user && (<>
              <Link to={createPageUrl('Profile')} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
                  <User className="h-4 w-4" />
                  {user.full_name || 'Profile'}
                </Button>
              </Link>

              {isAdmin && (
                <>
                  <div className="border-t border-border my-2" />
                  <p className="crandell-eyebrow px-3 py-1">Admin</p>
                  {adminLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.path} to={createPageUrl(link.path)} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
                          <Icon className="h-4 w-4" />
                          {link.name}
                        </Button>
                      </Link>
                    );
                  })}
                </>
              )}

              <div className="border-t border-border my-2" />
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
              </>)}
            </div>
          </div>
        )}
      </header>

      {/* Main Content: plain div. An AnimatePresence wrapper here used to
          break the sticky header by transforming page content. */}
      <main className="pb-0">
        {children}
      </main>

      {/* Mortgage Rate Ticker, fixed at bottom (hidden on phones for pages
          that have their own sticky action bar) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 ${HIDE_TICKER_ON_MOBILE.includes(currentPageName) ? 'hidden md:block' : ''}`}
        style={{ bottom: 'env(safe-area-inset-bottom)' }}
      >
        <MortgageRateTicker />
      </div>

      {/* Footer, mirrors crandellrealestate.com */}
      <footer
        className="bg-secondary text-[var(--crandell-footer-text)] mt-20 mb-16 md:mb-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="crandell-container py-14">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10">
            <div>
              <h2 className="text-white text-xl mb-3">Crandell Real Estate Team | Balboa Realty</h2>
              <p className="text-[15px] text-[var(--crandell-footer-muted)] max-w-md">
                Buyer and seller guidance in Queen Creek and the East Valley, with strategy, presentation,
                and coordination from one local team.
              </p>
            </div>
            <div>
              <h3 className="text-white text-[19px] mb-4">Explore</h3>
              <ul className="space-y-2.5 text-[14.5px]">
                <li><Link to={createPageUrl('Search')} className="hover:text-white transition-colors">Search Homes</Link></li>
                {user && <li><Link to={createPageUrl('SavedProperties')} className="hover:text-white transition-colors">Saved Homes</Link></li>}
                {LEAD_PATHS.map((link) => (
                  <li key={link.href}><a href={link.href} className="hover:text-white transition-colors">{link.name}</a></li>
                ))}
                <li><a href={TEAM.communities} className="hover:text-white transition-colors">Communities</a></li>
                <li><a href={TEAM.about} className="hover:text-white transition-colors">About Tanner and Cailie</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-[19px] mb-4">Contact</h3>
              <ul className="space-y-2.5 text-[14.5px]">
                <li><a href={TEAM.phoneTel} className="hover:text-white transition-colors">{TEAM.phoneDisplay}</a></li>
                <li><a href={`mailto:${TEAM.email}`} className="hover:text-white transition-colors break-all">{TEAM.email}</a></li>
                <li><a href={TEAM.calendly} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Schedule a Call</a></li>
                <li className="text-[var(--crandell-footer-muted)]">Queen Creek, Arizona</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/15 mt-10 pt-6 flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.14em] mr-2">Follow</span>
            {SOCIAL.map((link) => {
              const Icon = SOCIAL_ICONS[link.name];
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="h-10 w-10 rounded-full border border-white/40 flex items-center justify-center hover:bg-white hover:text-secondary transition-colors"
                >
                  {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : <span className="text-xs font-bold" aria-hidden="true">Z</span>}
                </a>
              );
            })}
          </div>

          <div className="border-t border-white/15 mt-6 pt-6 grid gap-3 md:grid-cols-3 items-center text-[13px] text-[var(--crandell-footer-muted)]">
            <p>&copy; {new Date().getFullYear()} Crandell Real Estate Team | Balboa Realty</p>
            <p className="md:text-center">Equal Housing Opportunity</p>
            <p className="md:text-right">
              <a href={TEAM.privacy} className="text-[var(--crandell-footer-text)] hover:text-white">Privacy Policy</a>
              {' · '}
              <a href={TEAM.terms} className="text-[var(--crandell-footer-text)] hover:text-white">Terms of Service</a>
            </p>
          </div>
          <div className="mt-6 space-y-1 text-xs text-[var(--crandell-footer-muted)]">
            <p>All information should be verified by the recipient and none is guaranteed as accurate by ARMLS.</p>
            <p>Listings displayed may be from the ARMLS IDX program. Information source: ARMLS. Listing data last updated subject to availability.</p>
            <p><a href={MAIN_SITE} className="hover:text-white">crandellrealestate.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
