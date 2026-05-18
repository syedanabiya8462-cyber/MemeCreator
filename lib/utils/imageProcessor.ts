import sharp from 'sharp'

export interface ImageProcessOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  watermark?: {
    text: string
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    fontSize?: number
    color?: string
  }
  filters?: {
    brightness?: number
    contrast?: number
    saturation?: number
    blur?: number
  }
}

export async function processImage(
  inputBuffer: Buffer,
  options: ImageProcessOptions = {}
): Promise<Buffer> {
  let image = sharp(inputBuffer)

  // Resize if needed
  if (options.maxWidth || options.maxHeight) {
    image = image.resize(options.maxWidth, options.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
  }

  // Apply filters
  if (options.filters) {
    if (options.filters.brightness !== undefined || options.filters.contrast !== undefined) {
      image = image.linear(
        options.filters.brightness || 1,
        (options.filters.contrast || 0) * 128
      )
    }
    
    if (options.filters.saturation !== undefined) {
      image = image.modulate({
        saturation: options.filters.saturation
      })
    }
    
    if (options.filters.blur) {
      image = image.blur(options.filters.blur)
    }
  }

  // Add watermark
  if (options.watermark) {
    const metadata = await image.metadata()
    const svgWatermark = createWatermarkSVG(
      options.watermark.text,
      metadata.width || 800,
      metadata.height || 600,
      options.watermark.position || 'bottom-right',
      options.watermark.fontSize || 20,
      options.watermark.color || 'rgba(255,255,255,0.5)'
    )
    
    const watermarkBuffer = Buffer.from(svgWatermark)
    image = image.composite([{
      input: watermarkBuffer,
      gravity: options.watermark.position?.replace('-', '') || 'southeast'
    }])
  }

  // Convert format
  switch (options.format) {
    case 'jpeg':
      image = image.jpeg({ quality: options.quality || 80 })
      break
    case 'png':
      image = image.png({ quality: options.quality || 80 })
      break
    case 'webp':
      image = image.webp({ quality: options.quality || 80 })
      break
  }

  return await image.toBuffer()
}

function createWatermarkSVG(
  text: string,
  width: number,
  height: number,
  position: string,
  fontSize: number,
  color: string
): string {
  let x = 0, y = 0
  
  switch (position) {
    case 'top-left':
      x = 20
      y = fontSize + 10
      break
    case 'top-right':
      x = width - 20
      y = fontSize + 10
      break
    case 'bottom-left':
      x = 20
      y = height - 20
      break
    case 'bottom-right':
      x = width - 20
      y = height - 20
      break
    case 'center':
      x = width / 2
      y = height / 2
      break
  }
  
  return `
    <svg width="${width}" height="${height}">
      <text
        x="${x}"
        y="${y}"
        font-size="${fontSize}"
        fill="${color}"
        font-family="Arial, sans-serif"
        text-anchor="${position.includes('right') ? 'end' : position.includes('center') ? 'middle' : 'start'}"
        dominant-baseline="${position.includes('bottom') ? 'baseline' : position.includes('top') ? 'hanging' : 'middle'}"
        opacity="0.7"
      >${text}</text>
    </svg>
  `
}

export async function optimizeMemeImage(
  buffer: Buffer,
  addWatermark: boolean = false
): Promise<Buffer> {
  return await processImage(buffer, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    format: 'webp',
    ...(addWatermark && {
      watermark: {
        text: 'MemeMaster',
        position: 'bottom-right',
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)'
      }
    })
  })
}

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 70 })
    .toBuffer()
}

export async function addTextToImage(
  buffer: Buffer,
  texts: Array<{
    text: string
    x: number
    y: number
    fontSize: number
    fontFamily: string
    color: string
    outline?: boolean
    shadow?: boolean
    rotation?: number
  }>
): Promise<Buffer> {
  let image = sharp(buffer)
  const metadata = await image.metadata()
  
  const svgTexts = texts.map(text => {
    const styles = []
    if (text.outline) {
      styles.push(`stroke: black; stroke-width: 3px; paint-order: stroke;`)
    }
    if (text.shadow) {
      styles.push(`filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));`)
    }
    
    return `
      <text
        x="${text.x}%"
        y="${text.y}%"
        font-size="${text.fontSize}"
        font-family="${text.fontFamily}"
        fill="${text.color}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${text.rotation || 0}, ${text.x}%, ${text.y}%)"
        style="${styles.join(' ')}"
      >${escapeXml(text.text)}</text>
    `
  }).join('')
  
  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      ${svgTexts}
    </svg>
  `
  
  return await image
    .composite([{
      input: Buffer.from(svg),
      blend: 'over'
    }])
    .toBuffer()
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}