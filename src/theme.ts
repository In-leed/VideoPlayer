/**
 * Theme utilities for video player
 */

export type Theme = 'light' | 'dark';

/**
 * Get current theme from document
 */
export function getCurrentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/**
 * Set theme on document
 */
export function setTheme(theme: Theme): void {
  // Add transitioning class for smooth theme change
  document.documentElement.classList.add('theme-transitioning');
  
  // Set the theme attribute
  document.documentElement.setAttribute('data-theme', theme);
  
  // Store preference
  localStorage.setItem('theme', theme);
  
  // Remove transitioning class after animation
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 200);
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme(): Theme {
  const currentTheme = getCurrentTheme();
  const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
}

/**
 * Initialize theme from localStorage or system preference
 */
export function initTheme(): Theme {
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  
  if (savedTheme) {
    setTheme(savedTheme);
    return savedTheme;
  }
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme: Theme = prefersDark ? 'dark' : 'light';
  setTheme(theme);
  return theme;
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (theme: Theme) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent): void => {
    const theme: Theme = e.matches ? 'dark' : 'light';
    callback(theme);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handler);
}
