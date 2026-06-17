import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://benhanghoa.pages.dev',
  // Tạo URL sạch dạng /bang-gia (thư mục) — hợp với Cloudflare Pages
  build: {
    format: 'directory'
  }
});
