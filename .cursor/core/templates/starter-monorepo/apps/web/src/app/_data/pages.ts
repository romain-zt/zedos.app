// Data access for the home page. Kept out of the component (logic lives in a
// function, not in JSX — see 52-frontend-code.mdc). Fails soft to an empty list
// so the page renders even with no CMS / empty DB.
export interface PublishedPage {
  id: string;
  title: string;
}

export async function getPublishedPages(locale = "en"): Promise<PublishedPage[]> {
  const cms = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${cms}/api/pages?locale=${encodeURIComponent(locale)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: PublishedPage[] };
    return data.docs ?? [];
  } catch {
    return [];
  }
}
