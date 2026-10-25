// Uploads the demo photos in supabase/seed-images to the "product-images"
// bucket, with the same names the seed uses in products.image_path.
// Run with: pnpm db:images

import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error("Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
const folder = join(import.meta.dirname, "..", "supabase", "seed-images")

for (const name of await readdir(folder)) {
  const file = await readFile(join(folder, name))
  const { error } = await supabase.storage
    .from("product-images")
    .upload(name, file, { contentType: "image/png", upsert: true })
  console.log(error ? `failed  ${name}: ${error.message}` : `sent    ${name}`)
}
