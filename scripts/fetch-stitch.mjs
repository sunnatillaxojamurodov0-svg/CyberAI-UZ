import { stitch } from "@google/stitch-sdk";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "16528181881105732096";
const OUT_DIR = join(__dirname, "..", "public", "stitch", PROJECT_ID);

async function main() {
  console.log("Connecting to Stitch project:", PROJECT_ID);
  const project = stitch.project(PROJECT_ID);

  const screens = await project.screens();
  console.log(`Found ${screens.length} screens`);

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(OUT_DIR, "html"), { recursive: true });
  mkdirSync(join(OUT_DIR, "images"), { recursive: true });

  const manifest = [];

  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i];
    const screenId = screen.id || screen.screenId || `screen-${i}`;
    console.log(`[${i + 1}/${screens.length}] Screen: ${screenId}`);

    let htmlContent = null;
    let imageUrl = null;

    try {
      const htmlDownloadUrl = await screen.getHtml();
      console.log(`  HTML URL: ${htmlDownloadUrl}`);
      if (htmlDownloadUrl) {
        const resp = await fetch(htmlDownloadUrl);
        htmlContent = await resp.text();
        writeFileSync(join(OUT_DIR, "html", `${screenId}.html`), htmlContent);
      }
    } catch (e) {
      console.log(`  No HTML available: ${e.message}`);
    }

    try {
      imageUrl = await screen.getImage();
      console.log(`  Image URL: ${imageUrl}`);
      if (imageUrl) {
        const resp = await fetch(imageUrl);
        const buf = Buffer.from(await resp.arrayBuffer());
        writeFileSync(join(OUT_DIR, "images", `${screenId}.png`), buf);
      }
    } catch (e) {
      console.log(`  No image available: ${e.message}`);
    }

    manifest.push({
      id: screenId,
      title: screen.title || screen.name || `Screen ${i + 1}`,
      htmlFile: htmlContent ? `html/${screenId}.html` : null,
      imageFile: imageUrl ? `images/${screenId}.png` : null,
    });
  }

  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\nDone! Manifest written to:", join(OUT_DIR, "manifest.json"));
  console.log(`Total screens: ${screens.length}`);
}

main().catch(console.error);
