import type { LodgingType, IsraelZone } from "./supplierDetails";

/**
 * One-time seed data for "מרחבים ומקומות" suppliers, gathered via research.
 * israelZone is a rough צפון/מרכז/דרום classification for filtering —
 * not a surveyed location.
 */
export interface VenueSeed {
  name: string;
  region: string;
  website: string;
  contactName: string;
  phone: string;
  email: string;
  lodgingType: LodgingType;
  notes: string;
  israelZone: IsraelZone;
}

export const VENUE_SEED: VenueSeed[] = [
  { name: "המקום של יוסי אמר", region: "הוד השרון", website: "", contactName: "יוסי אמר", phone: "", email: "", lodgingType: "unknown", notes: "מקום פרטי שאינו מפורסם אונליין", israelZone: "מרכז" },
  { name: "חוות נאחת רוח", region: "כפר יחזקאל, עמק יזרעאל", website: "https://www.hava-baemek.co.il", contactName: "", phone: "053-7626208", email: "", lodgingType: "shared", notes: "מרחב אקולוגי וחינוכי. קמפינג, סדנאות קרקס ואקרובטיקה, קבוצות", israelZone: "צפון" },
  { name: "יגאל חווה בבת שלמה", region: "בת שלמה, כרמל", website: "", contactName: "יגאל", phone: "", email: "", lodgingType: "unknown", notes: "חווה אהובה לריטריטים, פרטי קשר לא נמצאו", israelZone: "צפון" },
  { name: "הורמזיס", region: "פארק המסילה, תל אביב", website: "https://www.instagram.com/hormesisclub/", contactName: "אמיר הצרוני", phone: "052-8616611", email: "amirhetsroni@gmail.com", lodgingType: "none", notes: "מתחם וולנס 650מ\"ר. סאונה, אמבטיות קרח, עד 250 משתתפים", israelZone: "מרכז" },
  { name: "יער המאכל", region: "בית לחם הגלילית, עמק יזרעאל", website: "https://www.bethlehemfoodforest.com", contactName: "", phone: "052-6901744", email: "yaaractivity@gmail.com", lodgingType: "shared", notes: "13 דונם גידול בר-קיימא. דוגמה מנחה ללינה משותפת/אוהלים", israelZone: "צפון" },
  { name: "חאן צרניחובסקי", region: "מושב עופר, כרמל", website: "https://hancharnichovsky.com", contactName: "צילה ועדי", phone: "052-9698148", email: "han.meshek11@gmail.com", lodgingType: "shared", notes: "חורשת פרי אורגנית, מרחב ריטריטים. עד 50 משתתפים", israelZone: "צפון" },
  { name: "חוות טבע האדם", region: "מושב ניר צבי, מרכז (20 דק' מת\"א)", website: "https://www.teva-haadam.co.il", contactName: "גילי שלג ורחלי אור שלג", phone: "054-8331255", email: "Loveteva@gmail.com", lodgingType: "shared", notes: "9 דונם מטע פקאנים. מרחב השכרה עם/בלי לינה", israelZone: "מרכז" },
  { name: "חווה של אהבה", region: "כרכור (פרדס חנה-כרכור)", website: "https://www.facebook.com/LoveFarmIsrael/", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מעגלים, סדנאות, כנסים. פרטי קשר לא נמצאו", israelZone: "צפון" },
  { name: "סננדו", region: "תל אביב, פארק המסילה", website: "https://www.sanando.co.il", contactName: "", phone: "054-5883099", email: "sanando.sauna@gmail.com", lodgingType: "none", notes: "ספא קהילתי עירוני. סאונה, בריכת קרח. פתוח פעמיים בשבוע", israelZone: "מרכז" },
  { name: "נערי האור רשפון", region: "הפרחים 4, רשפון", website: "https://www.youth-of-light.org", contactName: "", phone: "052-3117992", email: "contact@fpp.org.il", lodgingType: "none", notes: "חוות מרפא. סדנאות, מדיטציה, 20+ שנה פעילות", israelZone: "מרכז" },
  { name: "אוהל יעל", region: "יודפת, גליל", website: "https://www.ohelyael.co.il", contactName: "", phone: "052-2847676", email: "", lodgingType: "shared", notes: "גלמפינג בחורש טבעי. ריטריטים ואירועים פרטיים", israelZone: "צפון" },
  { name: "חוות האיסיים", region: "מושב אבן ספיר / עמק חפר", website: "https://www.essenefarm.com", contactName: "ד\"ר זוהר קציר", phone: "054-3344174", email: "", lodgingType: "none", notes: "ריטריטים של צום, ניקוי רעלים, יוגה — ללא לינה קבועה", israelZone: "מרכז" },
  { name: "גבעת חביבה", region: "ד.נ. מנשה (ליד חדרה)", website: "https://givathaviva.org.il", contactName: "", phone: "052-4475457", email: "campus@givathaviva.org.il", lodgingType: "room", notes: "קמפוס כנסים. 25 אולמות, עד 450 משתתפים, 270 מיטות לינה בחדרים", israelZone: "צפון" },
  { name: "הר יללת התנים", region: "מדרון הכרמל המערבי", website: "https://www.ahooo.co.il", contactName: "גיל אבירי", phone: "050-9629628", email: "ecohar@gmail.com", lodgingType: "shared", notes: "חורש טבעי. גיבוש, סדנאות בישול, יוגה, צמחי מרפא, נוף לים", israelZone: "צפון" },
  { name: "חוות שפע שורשים (עולש)", region: "מושב עולש, השרון", website: "", contactName: "יוסף", phone: "", email: "", lodgingType: "unknown", notes: "חווה אורגנית וקהילתית. לא נמצאו פרטי קשר", israelZone: "מרכז" },
  { name: "נטור", region: "כרמל, חיפה", website: "http://www.natur.co.il", contactName: "אמיתי אלון", phone: "052-4893016", email: "amitai.elon@gmail.com", lodgingType: "shared", notes: "אוהלי כיפה, בקתות, ג'קוזי, בריכה. השכרת חווה שלמה. ד.4.7/5", israelZone: "צפון" },
  { name: "יער", region: "לא נמצא", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "לא נמצא מידע. ייתכן ספק פרטי", israelZone: "לא ידוע" },
  { name: "משק רימונים", region: "לא נמצא", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "לא נמצא מידע. ייתכן משק פרטי", israelZone: "לא ידוע" },
  { name: "חוות אסיף", region: "פיתחת ניצנה, נגב", website: "", contactName: "", phone: "", email: "", lodgingType: "none", notes: "צמחי מדבר, ריטריטים נשיים ויצירתיים. אין אתר", israelZone: "דרום" },
  { name: "יער הפיות", region: "קיבוץ בית אורן, כרמל", website: "https://www.fairyforest.org", contactName: "לימור שובל", phone: "058-6437171", email: "", lodgingType: "shared", notes: "אירוח אקולוגי מ-2000, ביער אלונים. אוהלים, מטבח משותף, שבילים", israelZone: "צפון" },
  { name: "ארץ הצבי", region: "מדבר יהודה (ואדי קלט / עין פרת)", website: "https://www.tsvi.co.il", contactName: "", phone: "058-6883020", email: "tsvi546@gmail.com", lodgingType: "shared", notes: "ריזורט גלמפינג מדברי. אוהלים מעוצבים, מדורות, מפל ובריכה", israelZone: "דרום" },
  { name: "פרויקט נערי האור", region: "הפרחים 4, רשפון (רשת 8 מרכזים)", website: "https://www.youth-of-light.org", contactName: "", phone: "052-3117992", email: "contact@fpp.org.il", lodgingType: "none", notes: "8 מרכזים ברחבי הארץ. מוצרי לייפסטייל ומרחבי יום", israelZone: "מרכז" },
  { name: "אלאיה פולג", region: "חוף פולג, נתניה", website: "https://www.alayapoleg.com", contactName: "", phone: "050-8899788", email: "reception@alayapoleg.com", lodgingType: "room", notes: "מלון וולנס ריזורט. 65 חדרים, יוגה, מדיטציה, סאונד הילינג", israelZone: "מרכז" },
  { name: "לילי עולש", region: "עולש (השרון)", website: "", contactName: "לילי", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית. מומלץ לחפש באינסטגרם / פייסבוק", israelZone: "מרכז" },
  { name: "חווה במאור", region: "מושב מאור, מנשה (ליד חדרה)", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית שאינה מקודמת דיגיטלית", israelZone: "צפון" },
  { name: "החווה של סלע", region: "קריית טבעון", website: "", contactName: "סלע", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית שאינה מקודמת אונליין", israelZone: "צפון" },
  { name: "החווה של יעלי", region: "חדרה", website: "", contactName: "יעלי", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית שאינה מקודמת אונליין", israelZone: "צפון" },
  { name: "קיבוץ לוטן — אקו כיף", region: "ערבה, ליד אילת", website: "https://kibbutzlotan.com", contactName: "דפנה", phone: "08-6356935 / 054-9799030", email: "daphna@klotan.co.il", lodgingType: "room", notes: "כפר נופש אקולוגי, 20 חדרים בטיח אדמה, סדנאות בנייה ירוקה, וואטסו-שיאצו", israelZone: "דרום" },
  { name: "נאות סמדר", region: "ערבה, דרום הנגב", website: "https://neot-semadar.com", contactName: "", phone: "", email: "", lodgingType: "room", notes: "קיבוץ-קהילה אמנותית, אולם תרגול 65מ\"ר, 18 חדרים + 4 בקתות אקולוגיות, עד כ-60 איש", israelZone: "דרום" },
  { name: "חוות רום", region: "רכס כמון, נחל צלמון, צפון", website: "https://havatrom.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "ריזורט גלמפינג + ספא + מסעדה מקומית + חווה שיקומית עם עדר עיזים", israelZone: "צפון" },
  { name: "חוות קשואלה", region: "צפון", website: "https://www.kashuela.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "סדנאות לגופים מגוונים כולל ימי גיבוש; אוהלי קבוצה, טיפי משפחתי, שטח אוהלים", israelZone: "צפון" },
  { name: "חוות עמק איילון", region: "עמק איילון", website: "https://hea.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "ימי גיבוש וסדנאות למנהלים — תוכנית \"מסלול הערך\"", israelZone: "מרכז" },
  { name: "GLOW Glamping — ארץ הצבי (ואדי פרת)", region: "מדבר יהודה", website: "https://glow-glamping.co.il/resort/zvi-glamping-wadi-prat/", contactName: "", phone: "073-3715222", email: "", lodgingType: "shared", notes: "ריזורט גלמפינג מדברי מעוצב, אירועים פרטיים/עסקיים", israelZone: "דרום" },
  { name: "GLOW Glamping — כלל האתרים", region: "צפון ומדבר (מגוון אתרים)", website: "https://glow-glamping.co.il", contactName: "", phone: "073-3715222", email: "", lodgingType: "shared", notes: "חברת גלמפינג לאירועי חברה, פופ-אפ ומתחמים קבועים", israelZone: "לא ידוע" },
  { name: "בראליטו גלמפינג", region: "נייד / אתרים שונים", website: "https://www.barelitoglamping.com", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "השכרה והקמת מתחמי גלמפינג פופ-אפ לאירועים גדולים", israelZone: "לא ידוע" },
  { name: "נוף צוקים", region: "ים המלח / ערבה", website: "https://nofzuqim.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "ריטריטים במדבר, שקט ותנועה", israelZone: "דרום" },
  { name: "שיטים וילג'", region: "ערבה", website: "https://retreater.co.il/product/shitim_village/", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "מתחם ריטריטים בסביבה מדברית", israelZone: "דרום" },
  { name: "יער בראשית", region: "גני יהושע, תל אביב", website: "https://www.gocamping.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "מתחם קמפינג/גלמפינג עירוני ליד הירקון", israelZone: "מרכז" },
  { name: "כליל — כפר אקולוגי", region: "גליל מערבי", website: "", contactName: "", phone: "", email: "", lodgingType: "none", notes: "יישוב קהילתי-אקולוגי חילוני. סדנאות אמנות, ריפוי, מוזיקה", israelZone: "צפון" },
  { name: "עין הוד — כפר אמנים", region: "דרום הכרמל", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "כפר אמנים קהילתי, גלריות, תערוכות, אתרי אירוח כפריים", israelZone: "צפון" },
  { name: "קיבוץ ענבר — אירוח כפרי", region: "עמק יזרעאל / צפון", website: "https://www.inbar.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מרכז סדנאות, סמינרים וימי עיון; B&B קיבוצי", israelZone: "צפון" },
  { name: "כפר נופש עין זיוון", region: "רמת הגולן", website: "https://www.enzivan.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "11 בקתות עץ, סיורי חרמון ויקבים, ימי גיבוש עסקיים", israelZone: "צפון" },
  { name: "קיבוץ מורן", region: "גליל עליון", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מלון קיבוצי קטן, אווירה כפרית שלווה", israelZone: "צפון" },
  { name: "מדרשת הגולן", region: "רמת הגולן", website: "https://mhg.rgl.org.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "בית הארחה באווירה קיבוצית, מדרשה חינוכית", israelZone: "צפון" },
  { name: "נוימן — מרכז ויפאסנה יבנאל", region: "יבנאל, הגליל התחתון", website: "https://newmanvipassana.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מרכז מדיטציה מול מטעי זיתים; חדרי לינה בדרגות שונות", israelZone: "צפון" },
  { name: "תובנה (ויפאסנה)", region: "מספר אתרים בארץ", website: "https://tovana.org.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "ריטריטים ארוכים וקצרים בשיטת גואנקה", israelZone: "לא ידוע" },
  { name: "Become One — מרכז זן", region: "ישראל (מספר מיקומים)", website: "https://becomeonenow.com", contactName: "תמיר מסאס", phone: "", email: "", lodgingType: "room", notes: "ריטריטי זן ומיינדפולנס", israelZone: "לא ידוע" },
  { name: "סקולינרי", region: "קיבוץ יגור", website: "https://www.schoolinary.org", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מתחם סדנאות בישול לצוותי מנהלים ועובדים", israelZone: "צפון" },
  { name: "אקסטרים יער בן שמן", region: "יער בן שמן, מרכז", website: "https://bepaintball.com", contactName: "", phone: "", email: "", lodgingType: "none", notes: "ימי גיבוש בטבע — פיינטבול, הרפתקאות", israelZone: "מרכז" },
  { name: "גיבושטח", region: "ארצי — אתרי טבע שונים", website: "https://gibush-shetach.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "הפקת ימי גיבוש, ריטריטים ופעילויות שטח לחברות", israelZone: "לא ידוע" },
  { name: "החווה של דני", region: "מרכז / שרון", website: "https://dannysfarm.org.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "חווה טיפולית עם בעלי חיים, סדנאות. דוגמה מנחה ל'ללא לינה'", israelZone: "מרכז" },
  { name: "חוות חוזרים לחיות", region: "מרכז הארץ", website: "https://back2life.org.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "חווה ללוחמים משוחררים; קליניקה, גינה טיפולית, נגרות, יוגה", israelZone: "מרכז" },
  { name: "חוות קרן אור", region: "לא צוין במדויק", website: "https://www.kerenorfarm.com", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מרכז טיפולי-שיקומי עם בעלי חיים בגישת שיקום הדדי", israelZone: "לא ידוע" },
  { name: "אקו-חי", region: "לא צוין במדויק", website: "https://eco-hai.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "שיקום הדדי אדם-בעל חיים, קבוצות קטנות, קייטנות וסדנאות", israelZone: "לא ידוע" },
  { name: "נחשולים — ריטריט וולנס", region: "חוף נחשולים, ליד זכרון יעקב", website: "https://findmycenter.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "152 יחידות אירוח בדרגות שונות, יוגה ותנועה, הרצאות וסדנאות", israelZone: "צפון" },
  { name: "מרכז סורנטו וולנס", region: "מספר סניפים", website: "https://healthvacations.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "רשת ריטריטי וולנס", israelZone: "לא ידוע" },
  { name: "סתלבט", region: "צפון (מיקום קיבוצי)", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "כפר נופש בקיבוץ, מדורג מהמומלצים בארץ", israelZone: "צפון" },

  // ── Second research round ──
  { name: "בוטיק אל-רום", region: "קיבוץ אל-רום, צפון רמת הגולן", website: "https://www.hostelrom.com", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מלון בוטיק בגובה כ-1070 מ', מדשאות, אולם קולנוע, אווירה כפרית-משפחתית", israelZone: "צפון" },
  { name: "Oaks Hotel (אוקס)", region: "בוקעתא, רמת הגולן", website: "https://oaks-hotel.com", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מלון בוטיק למבוגרים בלבד, 41 חדרים, ספא יוקרתי, בריכה, גג נוף", israelZone: "צפון" },
  { name: "בית הארחה בית וגן", region: "בית וגן, ירושלים", website: "https://bvh.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "כ-35 אולמות בגדלים שונים, ניסיון רב-שנים בכנסים ואירועי חברות", israelZone: "מרכז" },
  { name: "נתיבל'ה", region: "סמוך לקיבוץ נתיב הל\"ה, עמק האלה", website: "https://goinn.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "אירוח קבוצות פרטיות ומאורגנות, שבתות חתן, אירועים משפחתיים", israelZone: "מרכז" },
  { name: "כפר הנופש כפר כנרת (חוף האון)", region: "כביש 92, חוף מזרחי כנרת", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "כ-105 יחידות אירוח, אולמות לכנסים והופעות, שטחי דשא פתוחים", israelZone: "צפון" },
  { name: "מעגן עדן כפר נופש", region: "חוף הכנרת", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מרכז כנסים: 2 אולמות ל-70-150 איש, 3 כיתות ל-30-40 איש, בריכות", israelZone: "צפון" },
  { name: "מלון ארץ כנרת", region: "עמק הירדן", website: "https://www.eretz-kinneret.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מרכז כנסים עם 7 אולמות בגדלים שונים, לכנסים וסמינרים", israelZone: "צפון" },
  { name: "חוות כרמי נגב", region: "כ-4 ק\"מ לפני מצפה רמון", website: "https://www.karmeinegev.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "בקתות וגלמפינג, קשתות, טיולי אופניים במכתש, צפייה בכוכבים", israelZone: "דרום" },
  { name: "Ibex Hotel", region: "מצפה רמון", website: "https://www.ibexhotel.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "אירוח קבוצות קטנות ואיכותיות המחפשות פרטיות ושקט", israelZone: "דרום" },
  { name: "בית רמונא", region: "מצפה רמון, מול המכתש", website: "https://www.beit-ramona.com", contactName: "", phone: "", email: "", lodgingType: "none", notes: "חבילות קולינריות לקבוצות (14+ סועדים), ימי גיבוש, נוף למכתש", israelZone: "דרום" },
  { name: "מלון בראשית (Beresheet)", region: "מצפה רמון", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מלון יוקרה מול מכתש רמון, מתאים לאירוח בכיר וכנסים", israelZone: "דרום" },
  { name: "Six Senses Shaharut", region: "שחרות, ערבה דרומית", website: "https://www.sixsenses.com/he/hotels-resorts/middle-east-africa/israel/shaharut", contactName: "", phone: "", email: "", lodgingType: "room", notes: "ריזורט יוקרה, 60 סוויטות ווילות בריכה, ספא, חללי כנסים ייעודיים", israelZone: "דרום" },
  { name: "חוות האלפקות", region: "כ-3 ק\"מ ממערב למצפה רמון", website: "https://alpaca.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "גלמפינג, מפגש עם למות ואלפקות, סדנאות גוף ונפש, ימי גיבוש", israelZone: "דרום" },
  { name: "אקילה (Akila Yoga)", region: "לא צוין במדויק", website: "https://www.akila-yoga.co.il", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "מעל 80 ריטריטים של יוגה, יוגה-ויפאסנה, סדנאות מיינדפולנס", israelZone: "צפון" },
  { name: "ספא וילג' חמת גדר", region: "חמת גדר", website: "https://hamat-gader.com/en/spa-village-homepage/", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מלון בוטיק וספא יוקרתי בצפון", israelZone: "צפון" },
  { name: "Spa Beit Oren", region: "בית אורן, הר הכרמל", website: "https://spabeitoren.com", contactName: "", phone: "", email: "", lodgingType: "none", notes: "ספא בוטיק כפרי — בעיקר חוויה זוגית, לבדוק התאמה לקבוצות", israelZone: "צפון" },
  { name: "Dolphin Village Spa", region: "אילת", website: "https://www.dolphin-village.co.il/spa/", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מתחם ספא ווולנס עם אירוח באילת", israelZone: "דרום" },
  { name: "חוות לב הטבע", region: "לא צוין במדויק", website: "https://levhateva.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "רכיבה טיפולית, סדנאות גיבוש לצוותים, פיתוח אישי לעסקים", israelZone: "מרכז" },
  { name: "בית השנטי — חוות סוסים", region: "לא צוין במדויק", website: "https://shanti.org.il/horse-farm/", contactName: "מריומה קליין", phone: "", email: "", lodgingType: "none", notes: "סדנאות לחברות/קבוצות עם סוסים מהקרקע, רכיבה טיפולית", israelZone: "מרכז" },
  { name: "חוות גזית — טיולי סוסים", region: "לא צוין במדויק", website: "https://gazit-ranch.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "טיולי סוסים, ימי גיבוש וכיף, רכיבה טיפולית", israelZone: "צפון" },
  { name: "חוות בראשית — סוסים", region: "מרכז הארץ", website: "https://hbereshit.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "חוות סוסים במרכז (שונה מ'יער בראשית' הקיים במאגר)", israelZone: "מרכז" },
  { name: "חוות החופש (Freedom Farm)", region: "לא צוין במדויק", website: "https://www.freedom-farm.org.il", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "חווה טיפולית — נדרש בירור נוסף למיקום ולפרטי קשר", israelZone: "מרכז" },
  { name: "Sadnat Shiluv — חווה טיפולית", region: "לא צוין במדויק", website: "https://sadnat-shiluv.co.il", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "תחום חווה טיפולית, ייעוד לסדנאות שילוב", israelZone: "מרכז" },
  { name: "מזרע — כפר נופש ומרכז כנסים", region: "קיבוץ מזרע, עמק יזרעאל", website: "https://www.mizrabb.co.il/conferences-and-events", contactName: "", phone: "", email: "", lodgingType: "room", notes: "6 אולמות כנסים, אולם הופעות ל-350 מקומות עם במה", israelZone: "צפון" },
  { name: "Grand Vista — מלון בוטיק כפר יובל", region: "כפר יובל, גליל עליון", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "נוף לגליל, עיצוב כפרי, חוויות ומוצרים מקומיים לאירועים קטנים", israelZone: "צפון" },
  { name: "וילה התחנה, כפר הרוא\"ה", region: "אזור השרון", website: "", contactName: "", phone: "", email: "", lodgingType: "none", notes: "אווירה כפרית-עירונית, מתאימה לאירועים קטנים ומיוחדים", israelZone: "מרכז" },
  { name: "חווה במושבה", region: "סמוך לבית עובד / נס ציונה", website: "https://www.hafakot.co.il/location/%D7%97%D7%95%D7%95%D7%94-%D7%91%D7%9E%D7%95%D7%A9%D7%91%D7%94/", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מתחם פסטורלי מוקף פרדסים, עד 150 אורחים, כולל ימי גיבוש לעובדים", israelZone: "מרכז" },
  { name: "בית קטן בבקעה", region: "שכונת בקעה, ירושלים", website: "https://www.kolhair.co.il/businesses/107613/", contactName: "", phone: "", email: "", lodgingType: "none", notes: "שני אולמות לאירועים קטנים-בינוניים, לצד מלון בוטיק וחניה", israelZone: "מרכז" },
  { name: "סופיה כנסים ואירועים", region: "ירושלים, נוף להר הזיתים", website: "", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מתחם אירועים יוקרתי עד 300 איש, קייטרינג עשיר, בר, הגברה ותאורה", israelZone: "מרכז" },
  { name: "מלון לוגוס יד השמונה", region: "יד השמונה, הרי ירושלים", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מלון עם אירוח קבוצות באזור ירושלים", israelZone: "מרכז" },
  { name: "FoodSteps — סדנאות בישול", region: "תל אביב", website: "https://foodsteps.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "סטודיו לסדנאות בישול קולינריות לזוגות, חברים וצוותים", israelZone: "מרכז" },
  { name: "ורד פרן — קורסי בישול", region: "חיפה", website: "https://veredferen.co.il", contactName: "ורד פרן", phone: "", email: "", lodgingType: "none", notes: "סדנאות בישול לחברות לגיבוש צוות, סגנונות מגוונים", israelZone: "צפון" },
  { name: "טעם השף — סדנאות בישול לקבוצות", region: "לא צוין במדויק", website: "https://www.taamhachef.org.il", contactName: "שף גיא רוזן", phone: "", email: "", lodgingType: "none", notes: "סדנאות בישול מגבשות בהובלת שף, חוויה קולינרית", israelZone: "מרכז" },
  { name: "De Beer — סדנאות בישול לגיבוש", region: "לא צוין במדויק", website: "https://www.de-beer.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "סדנאות בישול איטלקי, גלילי, ערבי, אסייתי, יווני, מקסיקני, סושי", israelZone: "מרכז" },
  { name: "4Chef — ערב גיבוש וכיף", region: "לא צוין במדויק", website: "https://www.4chef.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "סדנאות בישול חווייתיות בהשראת מטבחים איטלקיים לערבי גיבוש", israelZone: "מרכז" },
  { name: "Mevashlim — סדנאות גיבוש לעובדים", region: "לא צוין במדויק", website: "https://www.mevashlim.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "ימי כיף וסדנאות בישול לקבוצות וארגונים", israelZone: "מרכז" },
  { name: "וולנספא סינרגיה", region: "נגב", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "בריכת מלח, חמאם מסורתי, סאונה, חיבור למדבר", israelZone: "דרום" },
  { name: "מתחם וולנס להב וגבעות בר", region: "נגב", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "חוויות וולנס מרגיעות באזור להב וגבעות בר", israelZone: "דרום" },
  { name: "רמון תיירות מדבר — ימי כיף לחברות", region: "מצפה רמון", website: "https://www.ramontours.com/fundays", contactName: "", phone: "", email: "", lodgingType: "none", notes: "טיולי ג'יפים, ימי גיבוש וכיף לחברות בדרום", israelZone: "דרום" },
  { name: "הוואיה — Havayot Center", region: "לא צוין במדויק", website: "https://www.havayot-center.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מרכז חוויות, פסיכותרפיה בעזרת בעלי חיים וסוסים, סדנת יוגה צחוק", israelZone: "מרכז" },
  { name: "וילה קרם יוסף", region: "לא צוין במדויק", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "עד 25 לינה, עד 40 לאירוע, בריכה וג'קוזי", israelZone: "מרכז" },
  { name: "חוות נועם", region: "נגב, סמוך למכתש רמון", website: "", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "סוויטות, אוהלי גלמפינג, שטחי קמפינג, קרוואנים — אירוח קבוצות", israelZone: "דרום" },
  { name: "אשכולות — בתי הארחה", region: "רשת ארצית", website: "https://www.eshkolot-il.com", contactName: "", phone: "", email: "", lodgingType: "room", notes: "פורטל/רשת בתי הארחה — נדרש בירור אתר בודד", israelZone: "לא ידוע" },
];

/** Venues where only the name is known — no site/contact/location found. */
export const NAME_ONLY_SEED = [
  { name: "חוות טללי אביב", sourceNote: "אוזכר בחיפוש כללי, לא נמצא אתר/פרטים מדויקים" },
  { name: "חוות שקד", sourceNote: "אוזכר לצד פארק סיירת שקד בנגב, לא אומת כמתחם אירוח" },
  { name: "צליל בגליל — כפר שמאי", sourceNote: "נמצא כצימר בגליל עליון; לא אומת התאמה לאירועי חברה" },
  { name: "תמר גלמפינג", sourceNote: "נמצא כספק אוהלי גלמפינג למכירה — לא בהכרח מתחם פעיל, דורש בירור" },
  { name: "וולנס הוליסטי (מלון/מרכז ספא)", sourceNote: "אוזכר בכתבה על מתחמי ספא בישראל, שם לא ודאי, נדרש אימות" },
  { name: "iPlan — קטלוג מקומות לאירוח מוזמנים", sourceNote: "פורטל מקומות מ-iplan.co.il, שמות ספציפיים לא חולצו" },
];
