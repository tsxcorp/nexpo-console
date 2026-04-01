import { createDirectus, rest, authentication } from '@directus/sdk';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

/** Client-side Directus instance (browser) */
export const directus = createDirectus(directusUrl)
  .with(rest())
  .with(authentication());
