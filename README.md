# جدول شيفتات التيم

داشبورد لايف لجدول الشيفتات: مين شغال دلوقتي، جدول اليوم، جدول الأسبوع، وتعديل الجدول بـ PIN.

## التشغيل على Vercel
1. اربط الريبو ده بمشروع على Vercel (Framework: Other).
2. Storage → Create → **Blob** واربطه بالمشروع (بيضيف `BLOB_READ_WRITE_TOKEN` لوحده).
3. Settings → Environment Variables → ضيف `ADMIN_PIN` (الرقم السري للتعديل).
4. لو الـ Blob store اتعمل **Public** ضيف كمان `BLOB_ACCESS=public`.
5. Redeploy.

## الملفات
- `index.html` — الداشبورد كلها (واجهة + منطق الجدول).
- `api/schedule.js` — قراءة وحفظ الجدول في Vercel Blob (آخر 15 نسخة بتتحفظ كنسخ احتياطية).
