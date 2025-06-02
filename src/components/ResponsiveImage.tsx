import { type IResponsiveImageProps } from '@/lib/types'
import Image from 'next/image'

export default function ResponsiveImage({
  src,
  alt,
  className = '',
  width = 800,
  height = 800,
  sizes = '(max-width: 768px) 100vw, 800px',
  priority = false,
  quality = 85,
  onLoad,
  onError,
}: IResponsiveImageProps): React.ReactElement {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      quality={quality}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
