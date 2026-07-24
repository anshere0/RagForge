import { createAdminClient } from './server';

/**
 * Resolves a client ID given either a UUID or slug.
 */
export async function resolveClientId(idOrSlug: string): Promise<string | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  if (isUuid) {
    return idOrSlug;
  }

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', idOrSlug)
    .single();

  return client?.id || null;
}
