import { type IResponsiveImageProps } from '@/lib/types'

export default function ResponsiveImage({
  src,
  alt,
  className = '',
  onLoad,
  onError,
}: IResponsiveImageProps): React.ReactElement {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={onError}
      loading="lazy"
    />
  )
}
