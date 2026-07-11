import type { CollectionConfig } from "payload";

// Upload collection. Storage is handled by the S3 plugin (MinIO local).
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true, // public read; tighten if media is private
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    // No staticDir — files live in S3, not on local disk.
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true, // i18n: alt text is user-facing
      required: true,
    },
  ],
};
