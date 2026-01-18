# 🐘 Neon PostgreSQL Setup for Railway

## ✅ Session Kaybı Sorunu Çözüldü!

Railway restart olduğunda artık **Neon veritabanı** session'ları saklıyor.

---

## 📝 Railway Environment Variables

**Railway Dashboard → Your Project → Variables** tab'ına git ve ekle:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_HgJwV5Zp7UXc@ep-orange-credit-ahwd2w8x-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🎯 Nasıl Çalışıyor?

### 1. **OAuth Yap** (ilk kez):
```
https://chatbutton-production.up.railway.app/api/auth?shop=web-health-developer.myshopify.com
```

### 2. **Session Neon'a Kaydedilir**:
```sql
INSERT INTO shopify_sessions (
  id, shop, access_token, scope, expires
) VALUES (...)
```

### 3. **Railway Restart Olsa Bile**:
```sql
SELECT * FROM shopify_sessions WHERE shop = '...'
→ ✅ Session geri yüklenir
→ ✅ Ürünler gelir
→ ✅ Tekrar OAuth gerekmez
```

---

## 🗄️ Veritabanı Şeması

```sql
CREATE TABLE shopify_sessions (
  id VARCHAR(255) PRIMARY KEY,
  shop VARCHAR(255) NOT NULL,
  state VARCHAR(255),
  is_online BOOLEAN DEFAULT false,
  scope TEXT,
  access_token TEXT,
  expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shop ON shopify_sessions(shop);
```

---

## 🧪 Test:

1. Railway'de `DATABASE_URL` ekle
2. Deploy bekle (2-3 dakika)
3. OAuth yap
4. ✅ Ürünler gelir
5. Railway restart et
6. ✅ Ürünler **tekrar OAuth olmadan** gelir!

---

## 📊 Neon Dashboard:

```
https://console.neon.tech
```

**Queries** tab'ında görebilirsin:
```sql
SELECT * FROM shopify_sessions;
```

---

## ✅ Avantajlar:

- ✅ Railway restart olsa bile session kalır
- ✅ Birden fazla Railway instance kullanılabilir (scaling)
- ✅ Session'lar Neon'da merkezi olarak saklanır
- ✅ Ücretsiz Neon tier'ı yeterli (500 MB storage)

---

🚀 **Şimdi Railway'e `DATABASE_URL` ekle ve deploy et!**
