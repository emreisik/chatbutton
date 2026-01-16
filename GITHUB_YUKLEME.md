# 🚀 GitHub'a Yükleme Rehberi

Uygulamanızı GitHub'a "chatbuton" adıyla yüklemek için adım adım talimatlar.

## 📋 Adım 1: GitHub'da Repo Oluşturun

1. [GitHub.com](https://github.com)'a gidin ve giriş yapın
2. Sağ üstteki **+** işaretine tıklayın
3. **New repository** seçin
4. Şu bilgileri girin:
   - **Repository name**: `chatbuton`
   - **Description**: `Shopify WhatsApp Chat Button App`
   - **Public** veya **Private** seçin (istediğiniz gibi)
   - ❌ **Initialize this repository with a README** işaretlemeyin (zaten var)
   - ❌ **.gitignore** eklemeyin (zaten var)
   - ❌ **license** eklemeyin (zaten var)
5. **Create repository** butonuna tıklayın

## 📋 Adım 2: Terminal Komutları

GitHub'da repo oluşturduktan sonra terminal'de şu komutları çalıştırın:

### 1. WhatsApp klasörüne gidin
```bash
cd /Users/emre/Desktop/whatsapp
```

### 2. Git repository başlatın
```bash
git init
```

### 3. Tüm dosyaları ekleyin
```bash
git add .
```

### 4. İlk commit'i yapın
```bash
git commit -m "Initial commit: WhatsApp Chat Button Shopify App"
```

### 5. Ana branch'i main olarak ayarlayın
```bash
git branch -M main
```

### 6. GitHub remote ekleyin
⚠️ **ÖNEMLİ:** `YOUR_GITHUB_USERNAME` yerine kendi kullanıcı adınızı yazın!

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/chatbuton.git
```

**Örnek:**
```bash
git remote add origin https://github.com/emre/chatbuton.git
```

### 7. GitHub'a push edin
```bash
git push -u origin main
```

## 🔐 GitHub Kimlik Doğrulama

Push yaparken şifre isterse:

### Seçenek 1: Personal Access Token (Önerilen)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token** → **Generate new token (classic)**
3. Token adı: `Shopify App`
4. Scope'lar: `repo` işaretleyin
5. **Generate token** tıklayın
6. Token'ı kopyalayın (bir daha göremezsiniz!)
7. Terminal'de şifre yerine bu token'ı kullanın

### Seçenek 2: GitHub CLI

```bash
# GitHub CLI kurulu değilse
brew install gh

# Giriş yapın
gh auth login

# Repo oluşturun ve push edin
gh repo create chatbuton --public --source=. --remote=origin --push
```

## 📝 Tek Komutla (GitHub CLI ile)

GitHub CLI kuruluysa her şeyi tek komutla yapabilirsiniz:

```bash
cd /Users/emre/Desktop/whatsapp
git init
git add .
git commit -m "Initial commit: WhatsApp Chat Button Shopify App"
gh repo create chatbuton --public --source=. --remote=origin --push
```

## ✅ Başarılı Olduğunu Nasıl Anlarsınız?

Terminal'de şunu göreceksiniz:
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to X threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), XX.XX MiB | XX.XX MiB/s, done.
Total XX (delta X), reused 0 (delta 0), pack-reused 0
To https://github.com/YOUR_GITHUB_USERNAME/chatbuton.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## 🔗 Repo'nuzu Görüntüleyin

Tarayıcınızda şu adresi açın:
```
https://github.com/YOUR_GITHUB_USERNAME/chatbuton
```

## 📁 Yüklenecek Dosyalar

Şunlar GitHub'a yüklenecek:

### ✅ Yüklenenler
- ✅ Tüm kaynak kod dosyaları
- ✅ 13 dokümantasyon dosyası
- ✅ Extension dosyaları
- ✅ Package.json'lar
- ✅ Yapılandırma dosyaları
- ✅ README.md, LICENSE

### ❌ Yüklenmeyenler (.gitignore sayesinde)
- ❌ `.env` (API secrets - güvenlik için)
- ❌ `node_modules/` (bağımlılıklar - çok büyük)
- ❌ `.shopify/` (geçici dosyalar)
- ❌ `dist/` (build dosyaları)

## 🔒 Güvenlik Kontrol

Yüklemeden önce kontrol edin:

```bash
# .env dosyası .gitignore'da mı?
cat .gitignore | grep .env
```

Çıktı: `.env` görmeli

```bash
# .env dosyası staged değil mi?
git status
```

`.env` dosyası listede olmamalı!

## 🐛 Sorun Giderme

### "fatal: not a git repository"
```bash
git init
```

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/chatbuton.git
```

### "failed to push some refs"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Yanlış dosya eklendi
```bash
# Örnek: .env'yi kaldırmak için
git rm --cached .env
git commit -m "Remove .env from repo"
git push
```

## 📌 Sonraki Adımlar

GitHub'a yükledikten sonra:

1. **README'yi özelleştirin** - Kendi bilgilerinizi ekleyin
2. **Topics ekleyin** - `shopify`, `whatsapp`, `chat-button`, `shopify-app`
3. **Description güncelleyin** - "WhatsApp chat button for Shopify stores"
4. **Website ekleyin** - Uygulamanızın URL'si
5. **LICENSE doğru mu kontrol edin** - MIT zaten var

## 🌟 Repo'yu Geliştirin

### README Badge'leri Ekleyin

```markdown
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Shopify](https://img.shields.io/badge/shopify-app-95BF47)
![License](https://img.shields.io/badge/license-MIT-blue)
```

### GitHub Topics

Repo ayarlarından şu topic'leri ekleyin:
- `shopify`
- `shopify-app`
- `whatsapp`
- `chat-button`
- `react`
- `nodejs`
- `polaris`

## 🔄 Değişiklik Yapıp Güncellemek

İleride değişiklik yaptığınızda:

```bash
# Değişiklikleri ekle
git add .

# Commit yap
git commit -m "Açıklama buraya"

# Push et
git push
```

## 📞 Yardım

Sorun yaşarsanız:

1. **Git durumunu kontrol edin**: `git status`
2. **Remote'ları kontrol edin**: `git remote -v`
3. **Log'ları inceleyin**: `git log --oneline`

---

## 🎯 Hızlı Özet

```bash
cd /Users/emre/Desktop/whatsapp
git init
git add .
git commit -m "Initial commit: WhatsApp Chat Button Shopify App"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/chatbuton.git
git push -u origin main
```

**YOUR_GITHUB_USERNAME** yerine kendi kullanıcı adınızı yazmayı unutmayın!

**Başarılar!** 🚀
