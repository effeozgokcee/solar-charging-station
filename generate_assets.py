import os
import struct
import zlib

def make_png(width, height, color=(245, 166, 35)):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    scanlines = []
    row = b'\x00' + (bytes(color) + b'\xff') * width
    for _ in range(height):
        scanlines.append(row)
    raw = b''.join(scanlines)

    compressed = zlib.compress(raw, 1)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

os.makedirs('mobile/assets', exist_ok=True)

print("Creating icon.png (64x64)...")
open('mobile/assets/icon.png', 'wb').write(make_png(64, 64))
print("Creating splash.png (64x128)...")
open('mobile/assets/splash.png', 'wb').write(make_png(64, 128))
print("Creating adaptive-icon.png (64x64)...")
open('mobile/assets/adaptive-icon.png', 'wb').write(make_png(64, 64))
print("Creating favicon.png (32x32)...")
open('mobile/assets/favicon.png', 'wb').write(make_png(32, 32))
print("Assets created successfully")
