import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL, publicMetadata, privateRoutes } from "../src/seo-data.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "dist");
const template = await readFile(path.join(outputRoot, "index.html"), "utf8");
const privatePageNames = {
  "/login": "تسجيل الدخول إلى كير نست",
  "/register": "إنشاء حساب في كير نست",
  "/forgot-password": "استعادة كلمة مرور كير نست",
  "/reset-password": "إعادة تعيين كلمة مرور كير نست",
  "/account-security": "أمان حساب كير نست",
  "/bookings": "حجوزات كير نست",
  "/admin-panel": "إدارة كير نست",
  "/edit-profile": "ملف جليسة الأطفال في كير نست",
};

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function setMeta(html, attribute, key, value) {
  const tag = `<meta ${attribute}="${key}" content="${escapeAttribute(value)}" />`;
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`);
  return html.replace(pattern, tag);
}

function makePage(pathname, title, description, isPrivate) {
  const canonical = `${SITE_URL}${pathname}/`;
  let html = template.replace(/<title>.*?<\/title>/s, `<title>${escapeAttribute(title)}</title>`);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "name", "robots", isPrivate ? "noindex,nofollow" : "index,follow,max-image-preview:large");
  html = setMeta(html, "name", "googlebot", isPrivate ? "noindex,nofollow" : "index,follow,max-image-preview:large");
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  return html;
}

const pages = Object.entries(publicMetadata)
  .filter(([pathname]) => pathname !== "/")
  .map(([pathname, languages]) => ({ pathname, title: languages.ar[0], description: languages.ar[1], isPrivate: false }));

for (const pathname of privateRoutes) {
  if (pathname === "/view-user") continue;
  pages.push({
    pathname,
    title: privatePageNames[pathname] || "حساب كير نست",
    description: "إدارة حسابك في كير نست.",
    isPrivate: true,
  });
}

for (const page of pages) {
  const directory = path.join(outputRoot, page.pathname.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), makePage(page.pathname, page.title, page.description, page.isPrivate));
}
