import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Swaps a measurement (e.g., prompt file) dynamically without restarting opencode.
 */
export async function updateMeasurement(filePath: string, newContent: string) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  await fs.writeFile(absolutePath, newContent, 'utf-8');
  console.log(`Updated measurement at ${filePath}`);
}
