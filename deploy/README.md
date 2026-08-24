# AWS Lightsail 배포 초안 (서울)

`academy-web`을 **Ubuntu 인스턴스 + Docker Compose + Caddy(HTTPS)** 로 띄운다.
앱은 Next.js `standalone`, DB는 **Lightsail PostgreSQL**(권장) 또는 같은 인스턴스의 Postgres 컨테이너.

인스턴스에서 `next build`를 돌리므로 RAM **2GB + 스왑 2GB** 가 최소, **4GB** 면 편하다.
1GB 플랜에서는 빌드가 OOM 나기 쉽다.

## 구성

```text
브라우저 → :80/:443 Caddy (Let's Encrypt)
                 ↓
              app:3000  Next.js standalone
                 ↓  DATABASE_URL
         Lightsail PostgreSQL (또는 bundled postgres)
                 ↘  DIRECT_URL 은 migrate 컨테이너만
```

같은 Compose 네트워크에 `app` / `migrate` / `caddy` 가 있다. 3000은 호스트에 열지 않는다.

## 1. Lightsail 콘솔

리전은 **서울 (ap-northeast-2)**.

1. **인스턴스** — Ubuntu 24.04, 최소 2GB (권장 4GB). SSH 키를 받는다.
2. **고정 IP** — 인스턴스에 연결. 재부팅해도 주소가 바뀌지 않게.
3. **네트워킹** — IPv4 방화벽에 HTTP(80), HTTPS(443) 추가. SSH(22)는 유지. **3000은 열지 않는다.**
4. **데이터베이스**(권장) — PostgreSQL 16, 같은 리전, 자동 백업 켜기.

- 인스턴스가 DB에 붙도록 Lightsail에서 해당 인스턴스를 허용한다.
- 같은 리전 비공개 IP를 쓰려면 계정 **고급 → VPC 피어링**을 그 리전에 켠다.
- 연결 문자열에 `sslmode=require` 를 붙인다.

1. 도메인 A 레코드를 고정 IP로 둔다. Let's Encrypt가 인증하려면 **Caddy를 띄우기 전에 DNS가 살아 있어야** 한다.

## 2. 인스턴스 최초 설정

SSH로 들어간 뒤 Docker와 스왑을 만든다.

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"

sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

logout   # docker 그룹 적용 후 다시 SSH
```

저장소는 이 앱 레포(`academy-web`)를 clone 한다.

```bash
git clone https://github.com/coding-jjs/academy-web.git
cd academy-web
cp deploy/lightsail.env.example .env
nano .env
```

`.env` 는 커밋하지 않는다. `AUTH_SECRET` 은 인스턴스에서 만든다.

```bash
openssl rand -base64 32
```

## 3. Google OAuth

[Google Cloud Console](https://console.cloud.google.com/) 웹 클라이언트에 운영 URI를 추가한다.

- 승인된 자바스크립트 원본: `https://도메인`
- 승인된 리디렉션 URI: `https://도메인/api/auth/callback/google`

`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` 을 `.env`에 넣고, `ENABLE_DEV_LOGIN` 은 넣지 않는다.

## 4. 기동

```bash
chmod +x deploy/up.sh
./deploy/up.sh
```

스크립트는 이미지 빌드 → `prisma migrate deploy` → `app`과 `caddy` 기동 순이다.
관리형 DB 없이 같은 서버 Postgres로 시험할 때만:

```bash
# .env 의 DATABASE_URL / DIRECT_URL 을 deploy/lightsail.env.example 의 bundled-db 값으로
./deploy/up.sh --bundled-db
```

로그:

```bash
docker compose logs -f app caddy
```

브라우저에서 `https://도메인` 이 뜨면 Caddy 인증이 끝난 것이다.

## 5. 첫 원장

앱이 떠 있는 상태에서 Google **가입**으로 원장 이메일의 GUEST를 만든 뒤, 시크릿으로 한 번만 승격한다.
스크립트의 `--env-file=.env.local` 은 로컬용이라, 서버에서는 HTTP로 호출한다.

```bash
source .env
curl -sS -X POST "$NEXT_PUBLIC_APP_URL/api/admin/bootstrap-director" \
  -H "content-type: application/json" \
  -H "x-bootstrap-secret: $BOOTSTRAP_SECRET" \
  -d '{"email":"director@gmail.com"}'
```

이미 원장이 있으면 409. 시드 스크립트(`db:seed:test`)는 운영에서 실행하지 않는다.

## 6. 이후 배포

```bash
git pull
./deploy/up.sh
```

마이그레이션은 매번 `migrate deploy`로 적용된다. 이미 적용된 것은 건너뛴다.

## 점검

| 증상                  | 볼 곳                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| 빌드가 Killed         | RAM. 스왑 확인, 4GB 플랜, 또는 다른 머신에서 `docker build` 후 이미지 복사   |
| Caddy가 TLS 실패      | DNS A레코드, 방화벽 80/443, `APP_DOMAIN` 이 호스트명만인지 (`https://` 없이) |
| 로그인 리디렉션 오류  | Google 리디렉션 URI, `NEXT_PUBLIC_APP_URL` 이 `https://도메인`               |
| migrate advisory lock | `DIRECT_URL` 이 풀러가 아닌 직접 연결인지                                    |
| Prisma SSL            | Lightsail DB URL에 `?sslmode=require`                                        |

앱만 재시작:

```bash
docker compose up -d app --no-deps
```
