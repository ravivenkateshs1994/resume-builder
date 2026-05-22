import type { CSSProperties } from "react";

interface HeadshotAvatarProps {
  headshotUrl?: string;
  initials: string;
  alt: string;
  className: string;
  imageClassName?: string;
  fallbackClassName?: string;
  style?: CSSProperties;
}

export default function HeadshotAvatar({
  headshotUrl,
  initials,
  alt,
  className,
  imageClassName = "h-full w-full object-cover",
  fallbackClassName = "h-full w-full flex items-center justify-center",
  style,
}: HeadshotAvatarProps) {
  return (
    <div className={className} style={style}>
      {headshotUrl ? (
        <img src={headshotUrl} alt={alt} className={imageClassName} />
      ) : (
        <div className={fallbackClassName}>{initials || "?"}</div>
      )}
    </div>
  );
}
