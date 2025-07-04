import { promisify } from "util";
import { writeFile, unlink } from "fs";
import { exec } from "child_process";
import path from "path";
import { CLIENT_RENEG_LIMIT } from "tls";

const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);
const execAsync = promisify(exec);

export async function uploadAndGetUrl(
  buffer: Buffer,
  filename: string,
  bucket: string,
  accessGrant: string
): Promise<string> {
  const tempPath = path.join("/tmp", `${Date.now()}-${filename}`);
  await writeFileAsync(tempPath, buffer);

  try {
    // Upload to Storj
    const uploadCmd = `uplink cp ${tempPath} sj://${bucket}/${filename}`;
    await execAsync(uploadCmd);

    // Generate shareable URL
    const shareCmd = `uplink share --url --not-after=none sj://${bucket}/${filename}`;
    const { stdout } = await execAsync(shareCmd);

    // Extract URL from uplink output
    const url = stdout.split('URL       : ')[1].split('\n')[0].trim().replace('/s/', '/raw/');    
    return url;
  } finally {
    await unlinkAsync(tempPath).catch(() => {});
  }
}
