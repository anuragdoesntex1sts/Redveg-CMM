type CampaignLink = {
  destinationType?: string;
  destinationValue?: string | null;
  collectionLink?: string | null;
};

function decodeRepeatedly(value: string) {
  let decoded = value.trim();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

/** Extracts a RedVeg product slug from a slug, internal path, or legacy full URL. */
export function normalizeProductSlug(value: string | null | undefined) {
  const decoded = decodeRepeatedly(String(value || ""));
  let pathname = decoded;
  if (/^https?:\/\//i.test(decoded)) {
    try {
      pathname = new URL(decoded).pathname;
    } catch {
      return "";
    }
  }

  pathname = pathname.split(/[?#]/, 1)[0].replace(/^\/+/, "");
  const segments = pathname.split("/").filter(Boolean);
  const productIndex = segments.findIndex(segment => segment.toLowerCase() === "product");
  const slug = productIndex >= 0 ? segments[productIndex + 1] : segments.length === 1 ? segments[0] : "";
  return decodeRepeatedly(slug || "").replace(/^\/+|\/+$/g, "");
}

export function productHref(value: string | null | undefined) {
  const slug = normalizeProductSlug(value);
  return slug ? `/product/${encodeURIComponent(slug)}` : "/shop";
}

export function campaignHref(campaign: CampaignLink) {
  const value = String(campaign.destinationValue || "").trim();
  if (campaign.destinationType === "product") return productHref(value);
  if (campaign.destinationType === "category") return `/shop?category=${encodeURIComponent(value || "all")}`;
  if (campaign.destinationType === "collection") return campaign.collectionLink || value || "/shop";
  return value || "/shop";
}
