import Image from "next/image";

interface HeadshotAvatarProps {
  headshotUrl?: string;
  alt: string;
  className: string;
}

export default function HeadshotAvatar({
  headshotUrl,
  alt,
  className,
}: HeadshotAvatarProps) {
  const normalizedHeadshotUrl = headshotUrl?.trim();

  if (!normalizedHeadshotUrl) {
    return (
      <div
        className={`relative overflow-hidden ${className} bg-gray-200 flex items-center justify-center`}
        aria-label={alt}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3 text-gray-400"
          aria-hidden="true"
        >
          <circle cx="50" cy="35" r="20" fill="currentColor" opacity="0.55" />
          <ellipse cx="50" cy="82" rx="32" ry="22" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={normalizedHeadshotUrl} alt={alt} fill unoptimized sizes="100vw" className="h-full w-full object-cover" />
    </div>
  );
}
