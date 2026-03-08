import React, { useState, useEffect, useRef } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, UserButton } from "@clerk/clerk-react";
import logo from "../assets/logo.png";
import { UserRound, Key, Menu, X } from "lucide-react";

const STORAGE_KEY = "doctorToken_v1";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const navRef = useRef(null);

  const location = useLocation();
  const clerk = useClerk();
  const navigate = useNavigate();

  // Doctor login state sync
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // Hide navbar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Storage sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setIsDoctorLoggedIn(Boolean(e.newValue));
      }
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Doctors", href: "/doctors" },
    { label: "Services", href: "/services" },
    { label: "Appointments", href: "/appointments" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <>
      {showNavbar && <div className={navbarStyles.navbarBorder}></div>}

      <nav ref={navRef} className={navbarStyles.navbarContainer}>
        <div className={navbarStyles.contentWrapper}>
          <div className={navbarStyles.flexContainer}>

            {/* Logo */}
            <Link to="/" className={navbarStyles.logoLink}>
              <div className={navbarStyles.logoContainer}>
               <img
  src={logo}
  alt="logo"
  className={navbarStyles.logoImage}
  style={{ width: "130px", height: "130px", objectFit: "contain" }}
/>
              </div>

              <div className={navbarStyles.logoTextContainer}>
                <h1 className={navbarStyles.logoTitle}>
                  ShivaRaksha MediCare
                </h1>
                <p className={navbarStyles.logoSubtitle}>
                  HealthCare Solutions - Your wellness, our sacred mission.
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className={navbarStyles.desktopNav}>
              <div className={navbarStyles.navItemsContainer}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={
                        isActive
                          ? navbarStyles.navItemActive
                          : navbarStyles.navItemInactive
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Right Side */}
              <div className={navbarStyles.rightContainer}>
                <SignedOut>
                  <Link
                    to="/doctor-admin/login"
                    className={navbarStyles.doctorAdminButton}
                  >
                    <UserRound className={navbarStyles.doctorAdminIcon} />
                    Doctor Admin
                  </Link>

                  <button
                    onClick={() => clerk.openSignIn()}
                    className={navbarStyles.loginButton}
                  >
                    <Key className={navbarStyles.loginIcon} />
                    Login
                  </button>
                </SignedOut>

                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={navbarStyles.mobileToggle}
            >
              {isOpen ? (
                <X className={navbarStyles.toggleIcon} />
              ) : (
                <Menu className={navbarStyles.toggleIcon} />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className={navbarStyles.mobileMenu}>
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={idx}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`${navbarStyles.mobileMenuItem} ${
                      isActive
                        ? navbarStyles.mobileMenuItemActive
                        : navbarStyles.mobileMenuItemInactive
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  onClick={() => setIsOpen(false)}
                  className={navbarStyles.mobileDoctorAdminButton}
                >
                  Doctor Admin
                </Link>

                <div className={navbarStyles.mobileLoginContainer}>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      clerk.openSignIn();
                    }}
                    className={navbarStyles.mobileLoginButton}
                  >
                    Login
                  </button>
                </div>
              </SignedOut>
            </div>
          )}
        </div>

        <style>{navbarStyles.animationStyles}</style>
      </nav>
    </>
  );
};

export default Navbar;