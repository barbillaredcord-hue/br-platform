export const DOMAIN_EVENTS = {
  access: "br-access-state-changed",
  requests: "br-access-requests-refresh",
  commercial: "br-commercial-activity-refresh",
} as const;

export type DomainChange =
  | "access"
  | "requests"
  | "commercial"
  | "grant"
  | "manual-payment"
  | "all";

const invalidationMap: Record<DomainChange, readonly string[]> = {
  access: [DOMAIN_EVENTS.access],
  requests: [DOMAIN_EVENTS.requests],
  commercial: [DOMAIN_EVENTS.commercial],
  grant: [DOMAIN_EVENTS.access, DOMAIN_EVENTS.requests],
  "manual-payment": [
    DOMAIN_EVENTS.access,
    DOMAIN_EVENTS.requests,
    DOMAIN_EVENTS.commercial,
  ],
  all: [
    DOMAIN_EVENTS.access,
    DOMAIN_EVENTS.requests,
    DOMAIN_EVENTS.commercial,
  ],
};

export function getDomainInvalidationEvents(change: DomainChange) {
  return invalidationMap[change];
}

export function notifyDomainChange(change: DomainChange) {
  if (typeof window === "undefined") {
    return;
  }

  for (const eventName of getDomainInvalidationEvents(change)) {
    window.dispatchEvent(new Event(eventName));
  }
}

export function notifyAccessStateChanged() {
  notifyDomainChange("access");
}
