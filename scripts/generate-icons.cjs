// Generates AssignMe PWA icons as dependency-free PNGs (node:zlib only).
// Design: navy field, teal ring, coral core — matches brand tokens.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const NAVY = [11, 31, 58];
const TEAL = [15, 118, 110];
const CORAL = [249, 115, 96];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function paint(size) {
  // RGBA rows with filter byte 0.
  const rows = [];
  const c = size / 2;
  const rOuter = size * 0.36;
  const rInner = size * 0.2;
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      const d = Math.sqrt(dx * dx + dy * dy);
      let px;
      if (d <= rInner) px = CORAL;
      else if (d <= rOuter) px = TEAL;
      else px = NAVY;
      const o = 1 + x * 4;
      row[o] = px[0];
      row[o + 1] = px[1];
      row[o + 2] = px[2];
      row[o + 3] = 255;
    }
    rows.push(row);
  }
  return Buffer.concat(rows);
}

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = zlib.deflateSync(paint(size), { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(dir, { recursive: true });
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["maskable-512.png", 512]]) {
  fs.writeFileSync(path.join(dir, name), png(size));
  console.log("wrote", name, size + "x" + size);
}
