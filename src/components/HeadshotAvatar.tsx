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
  alt,
  className,
  imageClassName = "h-full w-full object-cover",
  style,
}: HeadshotAvatarProps) {
  const normalizedHeadshotUrl = headshotUrl?.trim();
  if (!normalizedHeadshotUrl) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <Image src={normalizedHeadshotUrl} alt={alt} fill unoptimized sizes="100vw" className={imageClassName} />
    </div>
  );
}
