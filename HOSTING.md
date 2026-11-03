# Hostingga chiqarish (Docker Compose)

Bu sozlama Docker o‘rnatilgan Linux server uchun. Domen DNS’i server IP manziliga yo‘naltiriladi; Caddy HTTPS sertifikatini avtomatik oladi. PostgreSQL va yuklangan media fayllari Docker volume’da saqlanadi.

## Birinchi marta sozlash

1. Serverga loyihani olib boring va `Docker` hamda `Docker Compose` o‘rnating.
2. `.env.production.example` faylidan `.env.production` nusxa yarating. Maxfiy faylni Git’ga qo‘shmang:

   ```powershell
   Copy-Item .env.production.example .env.production
   ```

3. `.env.production` ichida domenni, `SECRET_KEY`ni va PostgreSQL parolini o‘zgartiring. Shu domen `DOMAIN`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` qiymatlarida bir xil bo‘lsin.
4. Django uchun yangi kalit yaratish:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

5. DNS’da domen uchun `A` yozuvini server IP’iga qo‘ying. Serverda 80 va 443 portlariga ruxsat bering.
6. Loyihani ishga tushiring:

   ```powershell
   docker compose --env-file .env.production up -d --build
   ```

   Birinchi ishga tushishda migratsiyalar va statik fayllar avtomatik tayyorlanadi.
7. Admin foydalanuvchi yarating:

   ```powershell
   docker compose --env-file .env.production exec web python manage.py createsuperuser
   ```

8. Hosting xavfsizlik tekshiruvi:

   ```powershell
   docker compose --env-file .env.production exec web python manage.py check --deploy
   ```

## Hozirgi lokal ma’lumotlarni olib o‘tish

Docker’dagi PostgreSQL yangi va bo‘sh bo‘ladi; lokal SQLite bazasi o‘z-o‘zidan ko‘chmaydi. Eski kino/kategoriya/janrlarni ko‘chirish kerak bo‘lsa, avval lokal loyihada:

```powershell
.\venv\Scripts\python.exe manage.py dumpdata media_api --indent 2 -o media_api-seed.json
```

Keyin Docker Compose ishga tushgach, `media_api-seed.json` va `media` papkasini serverga olib borib konteynerga nusxalang va fixture’ni yuklang:

```powershell
docker compose --env-file .env.production cp .\media_api-seed.json web:/app/media_api-seed.json
docker compose --env-file .env.production cp .\media\. web:/app/media/
docker compose --env-file .env.production exec web python manage.py loaddata media_api-seed.json
```

`media` papkasidagi fayllar `media_data` volume’ida qoladi. Ko‘chirishni qilmasangiz, mavjud SQLite ma’lumotlari ham, poster fayllari ham yangi hostingda avtomatik paydo bo‘lmaydi.

## Video yuklash

Admin orqali yuklanadigan video `.mp4` bo‘lishi kerak. Brauzerda to‘g‘ri ijro etilishi uchun video H.264, audio AAC formatida bo‘lsin. Masalan, boshqa formatni quyidagicha aylantiring:

```bash
ffmpeg -i input.mkv -c:v libx264 -c:a aac -movflags +faststart output.mp4
```

Katta fayllarni yuklash vaqti Gunicorn timeout sozlamasiga hamda serverdagi bo‘sh disk joyiga bog‘liq. `compose.yaml` va `Dockerfile`da timeout alohida belgilanmagan; Gunicorn’ning standart 30 soniyalik timeout’i sekin yoki katta yuklashni uzib qo‘yishi mumkin. Serverga mos timeout qiymatini oldindan belgilab, keyin sozlang.

## Kundalik boshqaruv

```powershell
docker compose --env-file .env.production logs -f web
docker compose --env-file .env.production restart web
docker compose --env-file .env.production down
```

`down -v` buyrug‘ini ishlatmang: u PostgreSQL va media volume’larini ham o‘chirishi mumkin. Production’dan oldin ma’lumotlar bazasi hamda media volume uchun alohida backup rejasini yoqing.

Hozir reyting akkauntga emas, brauzer kalitiga bog‘langan. Ommaviy loyiha uchun keyingi muhim qadam — login qo‘shib, reytingni haqiqiy foydalanuvchi hisobiga bog‘lash va spamdan himoya qilish.

`check --deploy` tekshiruvida HSTS subdomen/preload bo‘yicha ogohlantirish qolishi mumkin. Bularni faqat barcha subdomenlar HTTPS’da ishlashi va domen preload ro‘yxatiga ataylab kiritilishi rejalashtirilganda yoqish kerak. Hozirgi Caddy sozlamasi asosiy `DOMAIN` uchun HTTPS beradi.
