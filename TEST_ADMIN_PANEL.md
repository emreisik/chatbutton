# 🧪 Admin Panel Test

## 1️⃣ Railway'i Aç
```
https://chatbutton-production.up.railway.app/
```

## 2️⃣ Göreceksin:
- ✅ WhatsApp Chat Button başlığı
- ✅ Phone Number input
- ✅ Default Message textarea
- ✅ Position dropdown
- ✅ Enable checkbox
- ✅ [SAVE] butonu
- ✅ **Sağ tarafta "Live Preview" kutusu**

## 3️⃣ Test Et:
1. Phone Number: `+905551234567`
2. Message: `Merhaba! Yardım istiyorum`
3. Position: `Bottom Right`
4. ✓ Enable
5. **SAVE** butonuna tıkla

## 4️⃣ Beklenen Sonuç:
- ✅ Yeşil banner: "Settings saved successfully!"
- ✅ **Live Preview kutusunda YESIL BUTON görünür**
- ✅ Preview butona tıklayınca WhatsApp açılır

## ❌ Eğer Görmüyorsan:
Railway deploy henüz tamamlanmamış demektir. Logs kontrol et:

Railway Dashboard → chatbutton → Deployments → Latest
```
✓ Build complete
✓ Deploy successful
✓ Server running on port 8080
```

Deployment başarılı olunca admin panel çalışır!
