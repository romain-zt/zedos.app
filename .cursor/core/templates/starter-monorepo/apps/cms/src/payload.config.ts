import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  // i18n is ALWAYS on (baseline). Default + at least one secondary locale.
  localization: {
    locales: ["en", "fr"],
    defaultLocale: "en",
    fallback: true,
  },
  // Admin panel i18n.
  i18n: {
    supportedLanguages: {},
  },

  admin: {
    user: Users.slug,
  },

  collections: [Users, Media, Pages],

  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),

  // Media ALWAYS goes to S3 (MinIO locally). Never local disk.
  plugins: [
    s3Storage({
      collections: {
        [Media.slug]: true,
      },
      bucket: process.env.S3_BUCKET || "media",
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "us-east-1",
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      },
    }),
  ],
});
