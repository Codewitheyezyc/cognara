import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('cognara_admin_session')
    return Response.json({ success: true })
  } catch (err: any) {
    console.error('[Admin Logout API Error]', err)
    return Response.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
