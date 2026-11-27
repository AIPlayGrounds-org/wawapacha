import { normalizeBasePath } from './shared/site'

const basePath = normalizeBasePath(process.env.PAGES_BASE_URL || '/')
const retiredRoutes = {
  '/historico': '#historia',
  '/aprende': '#lluvia',
  '/territorio': '#hacer',
  '/rios': '#hacer',
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      siteOrigin: 'https://aiplaygrounds-org.github.io',
    },
  },
  // Obsidian's presentation plugin uses port 3000.
  // Use 3100 here so localhost opens the site instead of Obsidian.
  devServer: { port: 3100 },
  app: {
    // GitHub Pages supplies a repository subpath through the deploy workflow.
    // Local development uses the domain root.
    baseURL: basePath,
    head: {
      htmlAttrs: { lang: 'es' },
    },
  },
  // The pages these paths served became chapters of the home page. Their
  // static HTML redirects to the chapter so old links keep working.
  routeRules: Object.fromEntries(
    Object.entries(retiredRoutes).map(([from, to]) => [
      from,
      { redirect: { to: `${basePath}${to}`, statusCode: 301 } },
    ]),
  ),
  vite: {
    build: {
      // Press clippings and stills stay files: inlined, they would weigh down the page's JS.
      assetsInlineLimit: (file: string) => (file.includes('/assets/press/') ? false : undefined),
    },
  },
  nitro: {
    prerender: {
      routes: ['/sitemap.xml', '/robots.txt', ...Object.keys(retiredRoutes)],
    },
  },
})
