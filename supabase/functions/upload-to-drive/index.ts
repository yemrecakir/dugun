import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN')!
const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')!

// Refresh token kullanarak yeni bir Access Token al (Kullanıcının kendi 2TB kotasını kullanır)
async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams()
  params.append('client_id', GOOGLE_CLIENT_ID)
  params.append('client_secret', GOOGLE_CLIENT_SECRET)
  params.append('refresh_token', GOOGLE_REFRESH_TOKEN)
  params.append('grant_type', 'refresh_token')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()

  if (!data.access_token) {
    console.error('Token error:', data)
    throw new Error('Google access token alınamadı. Refresh token geçersiz olabilir.')
  }

  return data.access_token
}

// Google Drive'a dosya yükle
async function uploadToGoogleDrive(
  file: File,
  accessToken: string
): Promise<{ id: string }> {
  const metadata = {
    name: `${Date.now()}-${file.name}`,
    parents: [GOOGLE_DRIVE_FOLDER_ID],
  }

  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append('file', file)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  )

  const data = await res.json()

  if (!res.ok) {
    console.error('Drive upload error:', data)
    throw new Error(data.error?.message || 'Google Drive yükleme hatası')
  }

  return data
}

// Dosyayı herkese açık yap (Böylece herkes görebilir)
async function makeFilePublic(fileId: string, accessToken: string) {
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }
  )
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Sadece POST desteklenir' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const guestName = formData.get('guest_name') as string | null

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Dosya gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!guestName) {
      return new Response(
        JSON.stringify({ error: 'Misafir adı gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Dosya tipi kontrolü
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return new Response(
        JSON.stringify({ error: 'Sadece fotoğraf ve video yüklenebilir' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Yükleniyor: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) - ${guestName}`)

    // Google'a yükle (Refresh Token ile kullanıcının kendi hesabına)
    const accessToken = await getAccessToken()
    const driveFile = await uploadToGoogleDrive(file, accessToken)
    await makeFilePublic(driveFile.id, accessToken)

    console.log(`Başarılı: ${driveFile.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        fileId: driveFile.id,
        mediaType: isVideo ? 'video' : 'image',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Hata:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Sunucu hatası' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
