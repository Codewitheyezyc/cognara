import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUserWriteBlog } from '@/lib/blog/eligibility'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

// Helper to estimate read time from HTML content
function getReadTimeMinutes(html: string): number {
  const textOnly = html.replace(/<[^>]*>/g, ' ') // Strip tags
  const words = textOnly.trim().split(/\s+/).filter(w => w.length > 0)
  const count = words.length
  return Math.max(1, Math.ceil(count / 200)) // 200 words per minute average
}

// Helper to generate a clean, unique slug
async function generateUniqueSlug(title: string, supabase: any): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // replace spaces/underscores with dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes

  let slug = baseSlug
  let count = 0
  let isUnique = false

  while (!isUnique && count < 10) {
    const checkSlug = count === 0 ? slug : `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
    const { data } = await supabase
      .from('cognara_blog_posts')
      .select('id')
      .eq('slug', checkSlug)
      .maybeSingle()

    if (!data) {
      slug = checkSlug
      isUnique = true
    }
    count++
  }

  // Fallback to random if conflicts persist
  if (!isUnique) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  return slug
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate eligibility
    const eligibility = await canUserWriteBlog(user.id, supabase)
    if (!eligibility.eligible) {
      return NextResponse.json({
        error: eligibility.message || 'You are not eligible to write blog posts.'
      }, { status: 403 })
    }

    // 3. Parse and validate body
    const body = await request.json()
    const {
      title,
      excerpt,
      content,
      coverImageUrl,
      category,
      domain,
      tags = [],
      seoTitle,
      seoDescription
    } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
    }

    // 4. Generate metadata & fields
    const slug = await generateUniqueSlug(title, supabase)
    const readTimeMinutes = getReadTimeMinutes(content)

    // Determine domain (lock to their allowed domains if community)
    let selectedDomain = domain || 'General'
    if (eligibility.author_type === 'community') {
      const allowed = eligibility.allowed_domains || []
      // If client supplied domain isn't allowed, use the first allowed domain
      if (allowed.length > 0 && !allowed.includes(selectedDomain)) {
        selectedDomain = allowed[0]
      }
    }

    // Status: Admin posts publish immediately; community posts start as 'pending_review'
    const isPostAdmin = eligibility.author_type === 'admin'
    const status = isPostAdmin ? 'published' : 'pending_review'
    const publishedAt = isPostAdmin ? new Date().toISOString() : null

    // 5. Insert post into DB
    const { data: post, error: insertError } = await supabase
      .from('cognara_blog_posts')
      .insert({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        cover_image_url: coverImageUrl || null,
        author_id: user.id,
        author_type: eligibility.author_type,
        status,
        category: category || 'learning-tips',
        domain: selectedDomain,
        tags,
        seo_title: seoTitle || title,
        seo_description: seoDescription || excerpt || null,
        read_time_minutes: readTimeMinutes,
        published_at: publishedAt
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error inserting blog post:', insertError)
      return NextResponse.json({ error: 'Failed to create blog post.' }, { status: 500 })
    }

    // 6. Notify admin if community submission
    if (!isPostAdmin && process.env.RESEND_API_KEY) {
      try {
        // Fetch author's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle()

        const authorName = profile?.name || 'A Cognara Pro user'

        await resend.emails.send({
          from: 'Cognara Alerts <alerts@cognaralearn.com>',
          to: 'hello@cognaralearn.com',
          subject: '📝 New blog post pending review',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
              <h2 style="color: #3D6AFF; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">New Blog Post Pending Review</h2>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Author:</strong> ${authorName}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Domain:</strong> ${selectedDomain}</p>
              <p><strong>Excerpt:</strong> ${excerpt || 'None'}</p>
              <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #3D6AFF; background: #f4f6fc; font-style: italic; border-radius: 4px;">
                "${excerpt || 'Click below to review the full content.'}"
              </div>
              <p>Review, approve, or reject this post directly in the Cognara Admin Dashboard:</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cognaralearn.com'}/admin/blog" style="display: inline-block; padding: 10px 20px; color: #ffffff; background: #3D6AFF; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Open Moderation Queue</a>
            </div>
          `
        })
        console.log(`[Resend Blog] Sent admin alert email for post by ${authorName}`)
      } catch (err: any) {
        console.error('[Resend Blog Error] Failed to send email alert:', err.message)
      }
    }

    return NextResponse.json({
      success: true,
      post,
      message: isPostAdmin
        ? 'Your blog post has been published immediately.'
        : 'Your blog post has been submitted for admin review.'
    })
  } catch (err: any) {
    console.error('Unhandled blog API error:', err)
    return NextResponse.json({ error: 'Server error occurred.' }, { status: 500 })
  }
}
