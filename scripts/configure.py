from pathlib import Path
import secrets
root=Path(__file__).resolve().parent.parent
path=root/".env"
if path.exists():
    print("Giữ nguyên .env đang có.")
else:
    content=(root/".env.example").read_text(encoding="utf-8")
    for key in ("JWT_SECRET","DB_PASSWORD","DEMO_PASSWORD"):
        content=content.replace(f"{key}=GENERATE_WITH_CONFIGURE",f"{key}={secrets.token_urlsafe(36)}")
    path.write_text(content,encoding="utf-8")
    print("Đã tạo .env. Mật khẩu demo nằm ở DEMO_PASSWORD. Không đưa .env lên Git.")
