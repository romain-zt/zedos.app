// First-paint home page. Renders with an EMPTY database (graceful empty state)
// so something is visible from day one (see 05-project-setup.mdc §2).
// Semantic, mobile-first, accessible markup (see 52-frontend-code.mdc) — not a
// div dump. Replace the copy/sections with real product content as slices land.
import { getPublishedPages } from "./_data/pages";

export default async function Home() {
  const pages = await getPublishedPages();

  return (
    <main id="main" className="home">
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">It&apos;s live.</h1>
        <p>
          Your project is set up and deploying. Content will appear here as it&apos;s
          published — this page renders even before the database has any.
        </p>
      </section>

      <section aria-labelledby="pages-title">
        <h2 id="pages-title">Published pages</h2>
        {pages.length === 0 ? (
          <p role="status">No published pages yet. Add one in the CMS and it shows up here.</p>
        ) : (
          <ul>
            {pages.map((page) => (
              <li key={page.id}>{page.title}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
