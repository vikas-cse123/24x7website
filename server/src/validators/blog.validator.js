import { z } from 'zod'
import { BLOG_CATEGORIES } from '../utils/blogCategories.js'
import { CONTENT_BLOCK_TYPES } from '../models/Blog.js'
import { SLUG_PATTERN } from '../utils/slugify.js'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/

const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\//.test(v) || v.startsWith('/api/media/'), 'Image URL must be a valid URL')
    .or(z.literal('')),
  publicId: z.string().trim().max(200).optional().default(''),
  alt: z.string().trim().max(200).optional().default(''),
})

const contentBlockSchema = z
  .object({
    type: z.enum(CONTENT_BLOCK_TYPES),
    level: z.coerce.number().int().min(2).max(4).optional(),
    text: z.string().trim().max(5000).optional(),
    items: z.array(z.string().trim().max(300)).max(30).optional(),
    url: z
      .string()
      .trim()
      .refine((v) => v === '' || /^https?:\/\//.test(v) || v.startsWith('/api/media/'), 'Image URL must be a valid URL')
      .or(z.literal(''))
      .optional(),
    alt: z.string().trim().max(200).optional(),
    caption: z.string().trim().max(300).optional(),
  })
  .superRefine((block, ctx) => {
    if (block.type === 'heading' && !(block.text || '').trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['text'], message: 'Heading text is required' })
    }
    if (block.type === 'paragraph' && !(block.text || '').trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['text'], message: 'Paragraph text is required' })
    }
    if (block.type === 'quote' && !(block.text || '').trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['text'], message: 'Quote text is required' })
    }
    if (block.type === 'list' && (!(block.items || []).some((i) => i.trim()))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items'], message: 'Add at least one list item' })
    }
    if (block.type === 'image' && !(block.url || '').trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'Image URL is required' })
    }
  })

// author / readingTime / publishedAt / audit fields are server-controlled and
// intentionally NOT accepted from clients.
const blogFields = {
  title: z.string().trim().min(3, 'Title is required').max(160),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)')
    .optional(),
  excerpt: z.string().trim().min(10, 'Excerpt must be at least 10 characters').max(400),
  content: z.array(contentBlockSchema).min(1, 'Add at least one content block'),
  coverImage: imageSchema.optional(),
  category: z.enum(BLOG_CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  destinationId: z.string().regex(OBJECT_ID, 'Invalid destination').nullable().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
}

// Create: apply defaults.
export const createBlogSchema = z.object({
  ...blogFields,
  coverImage: blogFields.coverImage.default({}),
  tags: blogFields.tags.default([]),
  destinationId: blogFields.destinationId.default(null),
  featured: blogFields.featured.default(false),
  published: blogFields.published.default(false),
  seoTitle: blogFields.seoTitle.default(''),
  seoDescription: blogFields.seoDescription.default(''),
})

// Update: partial with NO defaults so omitted fields stay untouched (ADR-011).
export const updateBlogSchema = z.object(blogFields).partial()

// Public list query.
export const listBlogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(9),
  search: z.string().trim().optional(),
  category: z.enum(BLOG_CATEGORIES).optional(),
  destination: z.string().trim().optional(), // destination slug
  tag: z.string().trim().optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

// Admin list query.
export const adminListBlogsQuerySchema = listBlogsQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  published: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})
