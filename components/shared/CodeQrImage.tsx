interface CodeQrImageProps {
  code?: string
  url?: string
  size?: number
  className?: string
}

export function CodeQrImage({ code, url, size = 120, className = '' }: CodeQrImageProps) {
  const target = url ?? `${process.env.NEXT_PUBLIC_APP_URL || 'https://ruwadapp.vercel.app'}/qr/${code}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(target)}`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={qrUrl} alt="رمز QR للانضمام" width={size} height={size} className={`rounded-ruwad-sm bg-white ${className}`} />
  )
}
