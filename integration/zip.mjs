// Small dependency-free ZIP writer for the explicit source release allowlist.
const table = Array.from({ length: 256 }, (_, value) => {
  let n = value;
  for (let bit = 0; bit < 8; bit++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes) {
  let n = 0xffffffff;
  for (const byte of bytes) n = table[(n ^ byte) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
}
export function makeZip(files) {
  const chunks = [], central = [], names = new Set(); let offset = 0;
  if (files.length >= 65535) throw new Error('ZIP64 is unsupported');
  for (const { name, bytes } of files) {
    if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').some(part => !part || part === '..' || part === '.') || names.has(name)) throw new Error('Unsafe or duplicate ZIP member');
    names.add(name);
    const utf8 = Buffer.from(name), crc = crc32(bytes), header = Buffer.alloc(30), record = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(33, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(bytes.length, 18);
    header.writeUInt32LE(bytes.length, 22); header.writeUInt16LE(utf8.length, 26);
    record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x0800, 8); record.writeUInt16LE(33, 14); record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(bytes.length, 20); record.writeUInt32LE(bytes.length, 24);
    record.writeUInt16LE(utf8.length, 28); record.writeUInt32LE(offset, 42);
    chunks.push(header, utf8, bytes); central.push(record, utf8); offset += header.length + utf8.length + bytes.length;
    if (offset > 0xffffffff) throw new Error('ZIP64 is unsupported');
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, directory, end]);
}
