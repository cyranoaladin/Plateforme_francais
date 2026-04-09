import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const UPLOADS_DIR = path.join(process.cwd(), ".data/uploads");
const BUCKET = process.env.S3_BUCKET_NAME!;
const ENDPOINT = process.env.S3_ENDPOINT!;
const REGION = process.env.S3_REGION || "eu-central";

const client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

function getContentType(filename: string): string {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function walkDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else files.push(full);
  }
  return files;
}

async function migrateDir(localDir: string, s3Prefix: string) {
  const files = walkDir(localDir);
  if (files.length === 0) {
    console.log(`⚠️  Dossier vide ou absent : ${localDir}`);
    return { success: 0, failed: 0 };
  }

  console.log(`\n📂 ${path.basename(localDir)}/ → s3://${BUCKET}/${s3Prefix}/`);
  console.log(`   ${files.length} fichiers`);

  let success = 0;
  let failed = 0;

  for (const filePath of files) {
    const relativePath = path.relative(localDir, filePath);
    const s3Key = `${s3Prefix}/${relativePath}`.replace(/\\/g, "/");
    const body = fs.readFileSync(filePath);

    try {
      await client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: body,
        ContentType: getContentType(filePath),
      }));
      console.log(`  ✅ ${s3Key} (${(body.length / 1024).toFixed(1)} KB)`);
      success++;
    } catch (err: any) {
      console.error(`  ❌ ${s3Key}: ${err.message?.split("\n")[0]}`);
      failed++;
    }
  }

  return { success, failed };
}

async function main() {
  console.log("🚀 Migration uploads locaux → S3 Hetzner");
  console.log(`   Bucket   : ${BUCKET}`);
  console.log(`   Endpoint : ${ENDPOINT}`);
  console.log(`   Source   : ${UPLOADS_DIR}`);

  const r1 = await migrateDir(path.join(UPLOADS_DIR, "copies"), "uploads/copies");
  const r2 = await migrateDir(path.join(UPLOADS_DIR, "documents"), "uploads/documents");

  const total = { success: r1.success + r2.success, failed: r1.failed + r2.failed };

  console.log("\n═══════════════════════════════════");
  console.log(`✅ Succès : ${total.success} fichiers`);
  if (total.failed > 0) console.log(`❌ Échecs : ${total.failed} fichiers`);
  console.log("═══════════════════════════════════");
}

main().catch(console.error);
