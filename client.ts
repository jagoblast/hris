// client.ts - Client-side hydration and initialization entry
export function initClientApp() {
  console.log('Nusantara HRIS Client initialized with D1 backend and JWT HS256 auth.');
}

if (typeof window !== 'undefined') {
  initClientApp();
}
