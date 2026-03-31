import { on } from "../lib/events.js";
import { throttle } from "../lib/events.js";

const THEME_KEY = "parkwise-theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

export function init(root) {
  const toggleButton = document.createElement("button");
  toggleButton.className = "theme-toggle";
  toggleButton.setAttribute("aria-label", "Toggle theme");
  toggleButton.innerHTML = `
    <svg class="theme-icon theme-icon--light" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" fill="currentColor"/>
    </svg>
    <svg class="theme-icon theme-icon--dark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" fill="currentColor"/>
    </svg>
  `;

  // Insert the toggle button into the topbar
  const topbarInner = root.querySelector(".topbar-inner");
  if (topbarInner) {
    topbarInner.appendChild(toggleButton);
  }

  // Get initial theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (prefersDark ? THEME_DARK : THEME_LIGHT);

  // Apply initial theme
  applyTheme(initialTheme);

  // Toggle theme on button click
  toggleButton.addEventListener("click", async () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || THEME_LIGHT;
    const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
    await setTheme(newTheme);
  });

  // Listen for theme changes from other parts of the app
  on("theme-change", (theme) => {
    applyTheme(theme);
  });

  // Throttled scroll event for back-to-top button visibility
  // This prevents excessive DOM updates during scroll events
  const backToTopButton = document.querySelector('.back-to-top');
  if (backToTopButton) {
    const throttledScrollHandler = throttle(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollThreshold = 300; // Show button after scrolling 300px

      if (scrollTop > scrollThreshold) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    }, 100); // Update at most once per 100ms

    window.addEventListener('scroll', throttledScrollHandler);

    // Handle back to top button click with smooth scrolling
    backToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Throttled resize event for responsive viewport updates
  const viewportInfo = document.getElementById('viewport-info');
  if (viewportInfo) {
    const throttledResizeHandler = throttle(() => {
      const width = window.innerWidth;
      let breakpoint = 'mobile';
      
      if (width >= 1024) breakpoint = 'desktop';
      else if (width >= 768) breakpoint = 'tablet';
      
      viewportInfo.textContent = `${width}px (${breakpoint})`;
    }, 250); // Update at most once per 250ms during resize

    // Initial call to set viewport info
    throttledResizeHandler();
    
    window.addEventListener('resize', throttledResizeHandler);
  }
}

async function setTheme(theme) {
  try {
    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);
    // Apply the theme
    applyTheme(theme);
    // Emit event for other components
    const { emit } = await import("../lib/events.js");
    emit("theme-changed", theme);
  } catch (error) {
    console.error("Failed to set theme:", error);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="color-scheme"]').setAttribute("content", theme);

  // Update button icons visibility
  const lightIcon = document.querySelector(".theme-icon--light");
  const darkIcon = document.querySelector(".theme-icon--dark");
  if (lightIcon && darkIcon) {
    if (theme === THEME_LIGHT) {
      lightIcon.style.display = "none";
      darkIcon.style.display = "block";
    } else {
      lightIcon.style.display = "block";
      darkIcon.style.display = "none";
    }
  }
}