import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://benhanghoa.com',
  // hybrid: MỌI trang vẫn tĩnh như cũ; CHỈ trang nào đặt `export const prerender = false`
  // (trang Tin tức) mới render tại chỗ trên Cloudflare → Google luôn thấy tin mới
  // mà KHÔNG cần build lại định kỳ.
  output: 'hybrid',
  adapter: cloudflare(),
  // Tạo URL sạch dạng /bang-gia (thư mục) — hợp với Cloudflare Pages
  build: {
    format: 'directory'
  }
});
