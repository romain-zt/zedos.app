import { describe, expect, it } from "vitest";
import { Pages } from "./Pages";

// Example of the test-first doctrine (.cursor/core/rules/30-test-strategy.mdc):
// a focused unit test on config, not a browser e2e.
describe("Pages collection", () => {
  const field = (name: string) => Pages.fields.find((f) => "name" in f && f.name === name);

  it("localizes user-facing content but not the slug identifier", () => {
    expect((field("title") as { localized?: boolean }).localized).toBe(true);
    expect((field("body") as { localized?: boolean }).localized).toBe(true);
    expect((field("slug") as { localized?: boolean }).localized).toBeUndefined();
  });

  it("denies writes to anonymous users", () => {
    expect(Pages.access?.create?.({ req: { user: null } } as never)).toBeFalsy();
    expect(Pages.access?.read?.({ req: { user: null } } as never)).toBe(true);
  });
});
