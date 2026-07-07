import { SupabaseClient } from '@supabase/supabase-js'

export interface AuthorProfile {
  name: string
  avatar_url: string | null
  email?: string
}

export async function getBlogPostAuthor(
  authorId: string,
  authorType: string,
  supabase: SupabaseClient
): Promise<AuthorProfile | null> {
  if (authorType === 'admin') {
    const { data } = await supabase
      .from('cognara_admin_users')
      .select('full_name, email, avatar_url')
      .eq('id', authorId)
      .maybeSingle()
    if (data) {
      return {
        name: data.full_name,
        email: data.email,
        avatar_url: data.avatar_url
      }
    }
  } else {
    const { data } = await supabase
      .from('profiles')
      .select('name, email, avatar_url')
      .eq('id', authorId)
      .maybeSingle()
    if (data) {
      return {
        name: data.name || 'Learner',
        email: data.email,
        avatar_url: data.avatar_url
      }
    }
  }
  return null
}

export async function batchResolveBlogPostAuthors(
  posts: any[],
  supabase: SupabaseClient
): Promise<any[]> {
  const adminIds = Array.from(new Set(posts.filter(p => p.author_type === 'admin').map(p => p.author_id)))
  const communityIds = Array.from(new Set(posts.filter(p => p.author_type === 'community').map(p => p.author_id)))

  const [adminsRes, profilesRes] = await Promise.all([
    adminIds.length > 0
      ? supabase.from('cognara_admin_users').select('id, full_name, email, avatar_url').in('id', adminIds)
      : Promise.resolve({ data: [] }),
    communityIds.length > 0
      ? supabase.from('profiles').select('id, name, email, avatar_url').in('id', communityIds)
      : Promise.resolve({ data: [] })
  ])

  const authorMap = new Map<string, AuthorProfile>()
  adminsRes.data?.forEach(a => {
    authorMap.set(a.id, { name: a.full_name, email: a.email, avatar_url: a.avatar_url })
  })
  profilesRes.data?.forEach(p => {
    authorMap.set(p.id, { name: p.name || 'Learner', email: p.email, avatar_url: p.avatar_url })
  })

  return posts.map(p => {
    const author = authorMap.get(p.author_id)
    return {
      ...p,
      profiles: author || { name: 'Cognara Author', email: 'N/A', avatar_url: null }
    }
  })
}
