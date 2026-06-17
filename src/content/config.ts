import { defineCollection, z } from "astro:content";

// Bộ sưu tập bài viết (CMS ghi markdown vào src/content/posts/)
const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string().default("macro"),
    image: z.string().optional(),
    summary: z.string().optional()
  })
});

// Bộ kiến thức nền (evergreen) — bài hướng dẫn cơ bản về giao dịch hàng hóa
const knowledge = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    summary: z.string(),
    updated: z.coerce.date().optional()
  })
});

export const collections = { posts, knowledge };
