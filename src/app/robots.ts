import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/explore', '/components', '/s/*'],
      disallow: ['/admin/', '/sandbox/', '/auth/'], // Don't crawl admin pages or raw sandbox iframe
    },
    sitemap: 'https://sniplive.com/sitemap.xml',
  };
}
