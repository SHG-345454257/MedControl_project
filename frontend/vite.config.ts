import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function seoFiles(siteUrl: string): Plugin {
  const site = new URL(siteUrl);
  if (!["http:", "https:"].includes(site.protocol) || site.username || site.password ||
      site.pathname !== "/" || site.search || site.hash) {
    throw new Error("VITE_SITE_URL должен содержать только адрес сайта (например, https://medcontrol.localhost)");
  }

  const files = new Map([
    ["robots.txt", {
      type: "text/plain",
      source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site.origin}/sitemap.xml\n`
    }],
    ["sitemap.xml", {
      type: "application/xml",
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site.origin}/</loc></url>\n</urlset>\n`
    }]
  ]);

  return {
    name: "medcontrol-seo-files",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0].slice(1);
        const file = path ? files.get(path) : undefined;
        if (!file) return next();

        response.setHeader("Content-Type", `${file.type}; charset=utf-8`);
        response.end(file.source);
      });
    },
    generateBundle() {
      for (const [fileName, { source }] of files) {
        this.emitFile({ type: "asset", fileName, source });
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const { VITE_SITE_URL = "https://medcontrol.localhost" } = loadEnv(mode, ".", "VITE_");

  return {
    plugins: [react(), tailwindcss(), seoFiles(VITE_SITE_URL)],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true
    },
    preview: {
      host: "0.0.0.0",
      port: 4173
    }
  };
});
