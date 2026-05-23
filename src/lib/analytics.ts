export type AnalyticsEventName =
  | "template_view"
  | "template_preview"
  | "template_select"
  | "template_apply_attempt";

export function trackEvent(eventName: AnalyticsEventName, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const event = {
    event: eventName,
    ...payload,
    timestamp: new Date().toISOString(),
  };

  const dataLayerTarget = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  if (Array.isArray(dataLayerTarget.dataLayer)) {
    dataLayerTarget.dataLayer.push(event);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", eventName, payload);
  }
}
