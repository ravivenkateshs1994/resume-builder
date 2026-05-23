import Image from "next/image";
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
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {headshotUrl ? (
        <Image src={headshotUrl} alt={alt} fill unoptimized sizes="100vw" className={imageClassName} />
      ) : (
        <div className={fallbackClassName}>{initials || "?"}</div>
      )}
    </div>
  );
}
