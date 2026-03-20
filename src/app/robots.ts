import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/login', '/contact', '/mentions-legales', '/cgu', '/politique-de-confidentialite'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/onboarding', '/profil', '/enseignant/', '/parent/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
