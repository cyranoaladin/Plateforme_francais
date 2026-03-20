import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
  return [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/login?mode=register`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.5 },
    { url: `${baseUrl}/mentions-legales`, priority: 0.3 },
    { url: `${baseUrl}/politique-de-confidentialite`, priority: 0.3 },
    { url: `${baseUrl}/cgu`, priority: 0.3 },
  ];
}
