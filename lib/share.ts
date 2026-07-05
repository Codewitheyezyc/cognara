'use client'

interface ShareParams {
  imageUrl: string
  title: string
  text: string
  platform: 'native' | 'whatsapp' | 'linkedin' | 'twitter' | 'download'
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export async function shareImageToSocial({
  imageUrl,
  title,
  text,
  platform,
  toast
}: ShareParams) {
  try {
    // Step 1 — Fetch the image and convert to File object
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const blob = await response.blob()
    const fileName = title.toLowerCase().replace(/\s+/g, '-') + '.png'
    
    const imageFile = new File([blob], fileName, {
      type: 'image/png'
    })

    // Step 2 — Share based on platform
    switch (platform) {
      case 'native':
        if (
          navigator.share && 
          navigator.canShare && 
          navigator.canShare({ files: [imageFile] })
        ) {
          await navigator.share({
            title: title,
            text: text,
            files: [imageFile]
          })
        } else {
          // Fallback — copy link
          await navigator.clipboard.writeText(imageUrl)
          toast('Link copied to clipboard ✓', 'info')
        }
        break;

      case 'whatsapp':
        // WhatsApp does not support direct file sharing from web
        await downloadImage(imageFile, fileName)
        
        // Open WhatsApp with text
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
          '_blank',
          'noopener,noreferrer'
        )
        
        toast(
          '📥 Image saved to your device. Open WhatsApp, start a message, tap attachment, and select it from your gallery.',
          'success'
        )
        break;

      case 'linkedin':
        // LinkedIn does not support direct image upload from web share
        await downloadImage(imageFile, fileName)

        window.open(
          'https://www.linkedin.com/feed/',
          '_blank',
          'noopener,noreferrer'
        )

        toast(
          '📥 Image saved to your device. Create a LinkedIn post and attach it for the full preview.',
          'success'
        )
        break;

      case 'twitter':
        await downloadImage(imageFile, fileName)

        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
          '_blank',
          'noopener,noreferrer'
        )

        toast(
          '📥 Image saved to your device. Attach it to your tweet/post for the preview.',
          'success'
        )
        break;

      case 'download':
        await downloadImage(imageFile, fileName)
        toast('Image saved to your device ✓', 'success')
        break;
    }
  } catch (error) {
    console.error('Share error:', error)
    // Fallback — just download
    toast('Could not share directly. Downloading image instead.', 'error')
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const fallbackFile = new File([blob], title + '.png', { type: 'image/png' })
      await downloadImage(fallbackFile, title + '.png')
    } catch (fallbackError) {
      console.error('Fallback download failed:', fallbackError)
      toast('Failed to download image.', 'error')
    }
  }
}

// Helper — download image to device
async function downloadImage(file: File, fileName: string) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
