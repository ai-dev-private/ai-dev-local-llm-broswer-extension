// Utility functions for DOM/CSS/JS extraction (expand as needed)
export function extractDOM() {
  return document.documentElement.outerHTML;
}

export function extractCSS() {
  let styles = '';
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        styles += rule.cssText + '\n';
      }
    } catch (e) {
      // Ignore CORS-restricted stylesheets
    }
  }
  return styles;
}

export function extractJS() {
  let scripts = '';
  document.querySelectorAll('script').forEach(script => {
    if (script.textContent) {
      scripts += script.textContent + '\n';
    }
  });
  return scripts;
}
