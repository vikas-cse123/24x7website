import { z } from 'zod'

// Colors are stored as hex only — no raw CSS injection via color fields.
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/

const optionalHex = z
  .string()
  .trim()
  .regex(HEX_COLOR, 'Use a hex color, e.g. #22c55e')
  .optional()
  .or(z.literal(''))

export const updateContactSchema = z.object({
  phone: z.string().trim().max(30, 'Phone is too long').optional(),
  showCountryCode: z.boolean().optional(),
  showPhoneInHeader: z.boolean().optional(),
})

export const updatePromotionalBannerSchema = z
  .object({
    enabled: z.boolean().optional(),
    message: z.string().trim().min(1, 'Message is required').max(300).optional(),
    ctaText: z.string().trim().max(60).optional(),
    ctaUrl: z.string().trim().max(300).optional(),
    shimmerEnabled: z.boolean().optional(),
    dismissible: z.boolean().optional(),
    backgroundColor: optionalHex,
    textColor: optionalHex,
  })
  .superRefine((data, ctx) => {
    // Never allow unsafe schemes (javascript:, data:, vbscript:).
    if (data.ctaUrl && /^(javascript|data|vbscript):/i.test(data.ctaUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ctaUrl'],
        message: 'Unsafe URL scheme is not allowed',
      })
    }
  })