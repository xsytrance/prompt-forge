import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Search, Moon, Sun, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navLinks = [
    { label: 'Bounties', to: '/#/' },
    { label: 'Lab', to: '/#/lab' },
    { label: 'Community', to: '/#/community' },
  ];

  const isActive = (to: string) => {
    if (to === '/#/') return location.pathname === '/';
    return location.pathname === to.replace('/#', '');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 lg:px-8 transition-all duration-300 ease-breathe ${
          scrolled
            ? 'bg-[rgba(250,250,249,0.85)] backdrop-blur-[12px] border-b border-[rgba(215,213,210,0.5)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-playfair text-xl font-bold text-moss-800 hover:text-moss-700 transition-colors duration-200"
          >
            🌿 Prompt Forge
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to.replace('/#', '')}
                className={`relative font-inter text-sm font-medium transition-colors duration-200 group ${
                  isActive(link.to)
                    ? 'text-moss-700'
                    : 'text-stone-700 hover:text-moss-700'
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-moss-500 transition-all duration-300 ease-breathe ${
                    isActive(link.to) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-lg text-stone-500 hover:text-moss-700 hover:bg-stone-100 transition-colors duration-200"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-stone-500 hover:text-moss-700 hover:bg-stone-100 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            to="/auth"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-[8px] border-2 border-moss-700 text-moss-700 font-inter text-sm font-medium hover:bg-moss-50 transition-all duration-200"
          >
            Register
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors duration-200"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-stone-50 shadow-xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300 ease-appear">
            <div className="flex items-center justify-between">
              <span className="font-playfair text-lg font-bold text-moss-800">
                Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to.replace('/#', '')}
                  onClick={() => setMobileOpen(false)}
                  className={`font-inter text-base font-medium py-2 ${
                    isActive(link.to) ? 'text-moss-700' : 'text-stone-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-auto pt-6 border-t border-stone-200">
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-[8px] border-2 border-moss-700 text-moss-700 font-inter text-sm font-medium hover:bg-moss-50 transition-all duration-200"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
