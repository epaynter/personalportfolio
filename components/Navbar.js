import { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';
import MobileNav from './MobileNav';
import { scrollToSection } from '../utils/scroll';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-soft' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <span className="text-heading-3 font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Eliot's Portfolio</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('projects')}
                className="text-body text-gray-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 font-medium transition-colors"
              >
                Projects
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-body text-gray-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 font-medium transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-body text-gray-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 font-medium transition-colors"
              >
                Contact
              </button>
              <DarkModeToggle />
            </div>
            <div className="md:hidden flex items-center space-x-4">
              <DarkModeToggle />
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <MobileNav 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        scrollToSection={scrollToSection}
      />
    </>
  );
} 