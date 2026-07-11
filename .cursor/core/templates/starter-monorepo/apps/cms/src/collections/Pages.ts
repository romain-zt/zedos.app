import type { CollectionConfig } from "payload";

// Example content collection showing localized fields + media relation.
export const Pages: CollectionConfig = {
  slug: "pages",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      // identifier — NOT localized
    },
    {
      name: "body",
      type: "richText",
      localized: true,
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
    },
  ],
};
