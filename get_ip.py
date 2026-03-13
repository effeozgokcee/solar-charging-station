import socket

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
local_ip = s.getsockname()[0]
s.close()
print(f"Local IP: {local_ip}")
print(f"Backend URL: http://{local_ip}:8000")
print(f"Set in mobile/.env: EXPO_PUBLIC_API_URL=http://{local_ip}:8000")
