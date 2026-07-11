import type { CollectionConfig } from "payload";

// Auth-enabled collection backing the admin panel.
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  // Default-deny posture: tighten per your access model.
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: "email",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
