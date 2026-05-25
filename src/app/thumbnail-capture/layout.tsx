/**
 * Bare-bones layout for the thumbnail capture route.
 * Strips body margin/padding and forces a white background so Puppeteer
 * sees exactly the template — no app chrome, no scrollbars.
 */
export default function ThumbnailCaptureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Override root-layout body styles for clean screenshot baseline */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: hidden !important;
        }
      `}</style>
      {children}
    </>
  );
}
