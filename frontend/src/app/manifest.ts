import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite',
    short_name: 'BrewLite',
    description: 'Chọn món và đặt cà phê BrewLite',
    start_url: '/menu',
    display: 'standalone',
    background_color: '#f8f3e8',
    theme_color: '#34241c',
    icons: [
      {
        src: '/icons/brewlite.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
