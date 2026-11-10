# AdiCore — תיק עבודות עסקי

מערכת להצגת עבודות ללקוחות: אתר ציבורי פרימיום + אזור אדמין מוגן. Next.js 16 + TypeScript + Tailwind CSS 4, RTL מלא בעברית.

## הרצה מקומי
```bash
cd portfolio
npm install
npm run dev        # http://localhost:3001
```

## משתני סביבה (`.env.local`)
- `MONGODB_URI` — כשמוגדר, עוברים אוטומטית מ-JSON למונגו
- `MONGODB_DB=adicore` — מסד נפרד מ-Adidata (הפרדה מלאה)
- `ADMIN_PASSWORD` — סיסמת האדמין (בלי תוויות `#` — נחתכות ב-env)

## אזורים
- `/` — אתר ציבורי: hero, סינון קטגוריות, חיפוש, כרטיסי עבודות
- `/work/[id]` — עמוד עבודה: גלריית Masonry + MediaLightbox (זום/סיבוב/החלפה/וידאו), קישור חי, שיתוף וואטסאפ
- `/admin` — התחברות בסיסמה → ניהול עבודות: פרסום/הדגשה/סדר, טופס מילוי, העלאת מדיה רב-קבצים, בחירת כרינה

## פריסה
פרויקט ורסל `adicore` (מקושר לתיקייה זו). ל-deploy: `vercel deploy --prod --yes` מתוך `portfolio/`.
לפריסה אוטומטית מה-git — בדשבורד ורסל: חברו את הריפו עם **Root Directory = portfolio**.
