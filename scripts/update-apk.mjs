// Publishes a new Android build on the site: copies the APK and refreshes app-latest.json.
//   node scripts/update-apk.mjs path/to/app.apk 1.0.1
import { copyFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [src, version] = process.argv.slice(2);
if (!src || !version) { console.error('usage: node scripts/update-apk.mjs <apk> <version>'); process.exit(1); }
const dest = 'public/downloads/association-members.apk';
copyFileSync(src, dest);
const data = readFileSync(dest);
const info = {
  name: 'association-members.apk', version, size: statSync(dest).size,
  sha256: createHash('sha256').update(data).digest('hex'),
  date: new Date().toISOString().slice(0, 10), minAndroid: '7.0', url: '/downloads/association-members.apk',
};
writeFileSync('public/app-latest.json', JSON.stringify(info, null, 2) + '\n');
console.log(info);
