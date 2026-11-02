# Adidata — ניהול קבצים פרימיום

מערכת נקייה לניהול **הקלטות, תמונות ומסמכים** — עם העלאה מהירה של כל סוג קובץ, כותרת אישית לכל קובץ,
ושיתוף **ישירות מוואטסאפ** לתוך המערכת (PWA Share Target).

- **Next.js (App Router) + TypeScript + Tailwind CSS v4** — קוד קצר ומודולרי
- **RTL מלא** בעברית, מותאם מובייל עם סיידבאר מעוצב (מגירה במובייל)
- **מסד נתונים מקומי JSON** (`data/db.json`) עם הכנה מובנית ל־**MongoDB**
- **PWA** — אפשר להתקין בטלפון ולשתף קבצים מוואטסאפ ישירות למערכת
- **זיהוי מודול אוטומטי** — קבצים שמגיעים מוואטסאפ מזוהים לפי סוגם (אודיו/תמונה/מסמך)
- **סל מיחזור** — מחיקה רכה עם שחזור עד 30 יום וניקוי אוטומטי
- **חיפוש גלובלי** — חיפוש אחד על כל המודולים, תוצאות מקובצות

## הרצה מקומית

```bash
npm install
npm run dev        # http://localhost:3000
```

הנתונים נשמרים ב־`data/db.json` והקבצים ב־`data/uploads/`.

## שיתוף מוואטסאפ (Android / Chrome)

1. פותחים את האתר בטלפון → תפריט דפדפן → **"הוסף למסך הבית"** (מתקין את האפליקציה).
2. בוואטסאפ: פותחים קובץ → **שיתוף** → בוחרים **"אדידאטה"**.
3. האפליקציה נפתחת בטופס העלאה עם הקבצים — בוחרים מודול, נותנים כותרת ומעלים.

> באייפון שומרים את הקובץ מוואטסאפ ואז מעלים אותו דרך טופס ההעלאה (אפל עדיין לא תומכת ב־Share Target לווב).

## פריסה בוורסל + מעבר ל־MongoDB

מצב JSON נהדר לפיתוח מקומי, אבל מערכת הקבצים של ורסל היא לקריאה בלבד — לכן בייצור מחליפים ל־Mongo:

1. פותחים [MongoDB Atlas](https://www.mongodb.com/atlas) (חינם) ומעלים cluster.
2. בוורסל: מייבאים את ה־repo (GitHub) ומוסיפים משתני סביבה:
   - `MONGODB_URI` — מחרוזת החיבור מ־Atlas
   - `MONGODB_DB` — (רשות) שם בסיס הנתונים, ברירת מחדל `adidata`
3. Deploy. זהו — הקוד עובר אוטומטית מ־JSON ל־Mongo (מטא־דאטה בקולקציה `items`, הקבצים עצמם כ־Binary בקולקציה `files`, עד ~15MB לקובץ).

### הפעלה מקומית מול Mongo

שומרים את מחרוזת החיבור בקובץ `.env.local` (לא נשלח ל־git) ומריצים `npm run dev` כרגיל:

```
MONGODB_URI="mongodb+srv://..."
MONGODB_DB=adidata
```

יש נתונים ישנים ב־JSON? `node scripts/migrate-json-to-mongo.mjs` מעתיק אותם ל־Mongo (בטוח להרצה חוזרת).

## מבנה הפרויקט

```
src/
├── app/
│   ├── page.tsx                  # דשבורד — סטטיסטיקות ולאחרונה
│   ├── [module]/page.tsx         # עמוד מודול (הקלטות/תמונות/מסמכים)
│   ├── upload/page.tsx           # טופס העלאה + קליטת שיתוף מוואטסאפ
│   └── api/
│       ├── upload/route.ts       # POST — העלאת קבצים
│       ├── items/route.ts        # GET — רשימת פריטים
│       ├── items/[id]/route.ts   # PATCH (כותרת/מודול) + DELETE
│       └── files/[id]/route.ts   # GET — הזרמת קובץ עם תמיכת Range לנגן
├── components/                   # AppShell (סיידבאר), ItemsView, UploadForm
└── lib/
    ├── store.ts                  # ממשק Store: JsonStore או MongoStore (לפי MONGODB_URI)
    ├── storage.ts                # אחסון קבצים: דיסק או Mongo Binary
    ├── mongo.ts                  # חיבור lazy ל־MongoDB
    ├── types.ts / modules.ts     # טיפוסים והגדרות מודולים
    └── format.ts                 # פורמט תאריך/גודל
public/
├── manifest.webmanifest          # PWA + share_target
├── sw.js                         # Service Worker לקליטת קבצים משותפים
└── icon-*.png / icon.svg         # אייקונים (נוצרים עם npm run icons)
```
