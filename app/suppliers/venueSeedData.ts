import type { LodgingType } from "./supplierDetails";

/**
 * One-time seed data for "מרחבים ומקומות" suppliers, gathered via research.
 * mapX/mapY are stylized positions on the Israel map (0–100), not real geo
 * coordinates — approximate placement by region, north→south / west→east.
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
  mapX: number;
  mapY: number;
}

export const VENUE_SEED: VenueSeed[] = [
  { name: "המקום של יוסי אמר", region: "הוד השרון", website: "", contactName: "יוסי אמר", phone: "", email: "", lodgingType: "unknown", notes: "מקום פרטי שאינו מפורסם אונליין", mapX: 42, mapY: 47 },
  { name: "חוות נאחת רוח", region: "כפר יחזקאל, עמק יזרעאל", website: "https://www.hava-baemek.co.il", contactName: "", phone: "053-7626208", email: "", lodgingType: "shared", notes: "מרחב אקולוגי וחינוכי. קמפינג, סדנאות קרקס ואקרובטיקה, קבוצות", mapX: 46, mapY: 33 },
  { name: "יגאל חווה בבת שלמה", region: "בת שלמה, כרמל", website: "", contactName: "יגאל", phone: "", email: "", lodgingType: "unknown", notes: "חווה אהובה לריטריטים, פרטי קשר לא נמצאו", mapX: 38, mapY: 30 },
  { name: "הורמזיס", region: "פארק המסילה, תל אביב", website: "https://www.instagram.com/hormesisclub/", contactName: "אמיר הצרוני", phone: "052-8616611", email: "amirhetsroni@gmail.com", lodgingType: "none", notes: "מתחם וולנס 650מ\"ר. סאונה, אמבטיות קרח, עד 250 משתתפים", mapX: 40, mapY: 42 },
  { name: "יער המאכל", region: "בית לחם הגלילית, עמק יזרעאל", website: "https://www.bethlehemfoodforest.com", contactName: "", phone: "052-6901744", email: "yaaractivity@gmail.com", lodgingType: "shared", notes: "13 דונם גידול בר-קיימא. דוגמה מנחה ללינה משותפת/אוהלים", mapX: 44, mapY: 30 },
  { name: "חאן צרניחובסקי", region: "מושב עופר, כרמל", website: "https://hancharnichovsky.com", contactName: "צילה ועדי", phone: "052-9698148", email: "han.meshek11@gmail.com", lodgingType: "shared", notes: "חורשת פרי אורגנית, מרחב ריטריטים. עד 50 משתתפים", mapX: 37, mapY: 29 },
  { name: "חוות טבע האדם", region: "מושב ניר צבי, מרכז (20 דק' מת\"א)", website: "https://www.teva-haadam.co.il", contactName: "גילי שלג ורחלי אור שלג", phone: "054-8331255", email: "Loveteva@gmail.com", lodgingType: "shared", notes: "9 דונם מטע פקאנים. מרחב השכרה עם/בלי לינה", mapX: 41, mapY: 43 },
  { name: "חווה של אהבה", region: "כרכור (פרדס חנה-כרכור)", website: "https://www.facebook.com/LoveFarmIsrael/", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מעגלים, סדנאות, כנסים. פרטי קשר לא נמצאו", mapX: 39, mapY: 33 },
  { name: "סננדו", region: "תל אביב, פארק המסילה", website: "https://www.sanando.co.il", contactName: "", phone: "054-5883099", email: "sanando.sauna@gmail.com", lodgingType: "none", notes: "ספא קהילתי עירוני. סאונה, בריכת קרח. פתוח פעמיים בשבוע", mapX: 40, mapY: 42 },
  { name: "נערי האור רשפון", region: "הפרחים 4, רשפון", website: "https://www.youth-of-light.org", contactName: "", phone: "052-3117992", email: "contact@fpp.org.il", lodgingType: "none", notes: "חוות מרפא. סדנאות, מדיטציה, 20+ שנה פעילות", mapX: 39, mapY: 41 },
  { name: "אוהל יעל", region: "יודפת, גליל", website: "https://www.ohelyael.co.il", contactName: "", phone: "052-2847676", email: "", lodgingType: "shared", notes: "גלמפינג בחורש טבעי. ריטריטים ואירועים פרטיים", mapX: 43, mapY: 20 },
  { name: "חוות האיסיים", region: "מושב אבן ספיר / עמק חפר", website: "https://www.essenefarm.com", contactName: "ד\"ר זוהר קציר", phone: "054-3344174", email: "", lodgingType: "none", notes: "ריטריטים של צום, ניקוי רעלים, יוגה — ללא לינה קבועה", mapX: 41, mapY: 44 },
  { name: "גבעת חביבה", region: "ד.נ. מנשה (ליד חדרה)", website: "https://givathaviva.org.il", contactName: "", phone: "052-4475457", email: "campus@givathaviva.org.il", lodgingType: "room", notes: "קמפוס כנסים. 25 אולמות, עד 450 משתתפים, 270 מיטות לינה בחדרים", mapX: 38, mapY: 34 },
  { name: "הר יללת התנים", region: "מדרון הכרמל המערבי", website: "https://www.ahooo.co.il", contactName: "גיל אבירי", phone: "050-9629628", email: "ecohar@gmail.com", lodgingType: "shared", notes: "חורש טבעי. גיבוש, סדנאות בישול, יוגה, צמחי מרפא, נוף לים", mapX: 36, mapY: 28 },
  { name: "חוות שפע שורשים (עולש)", region: "מושב עולש, השרון", website: "", contactName: "יוסף", phone: "", email: "", lodgingType: "unknown", notes: "חווה אורגנית וקהילתית. לא נמצאו פרטי קשר", mapX: 41, mapY: 38 },
  { name: "נטור", region: "כרמל, חיפה", website: "http://www.natur.co.il", contactName: "אמיתי אלון", phone: "052-4893016", email: "amitai.elon@gmail.com", lodgingType: "shared", notes: "אוהלי כיפה, בקתות, ג'קוזי, בריכה. השכרת חווה שלמה. ד.4.7/5", mapX: 37, mapY: 26 },
  { name: "יער", region: "לא נמצא", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "לא נמצא מידע. ייתכן ספק פרטי", mapX: 50, mapY: 50 },
  { name: "משק רימונים", region: "לא נמצא", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "לא נמצא מידע. ייתכן משק פרטי", mapX: 50, mapY: 52 },
  { name: "חוות אסיף", region: "פיתחת ניצנה, נגב", website: "", contactName: "", phone: "", email: "", lodgingType: "none", notes: "צמחי מדבר, ריטריטים נשיים ויצירתיים. אין אתר", mapX: 33, mapY: 78 },
  { name: "יער הפיות", region: "קיבוץ בית אורן, כרמל", website: "https://www.fairyforest.org", contactName: "לימור שובל", phone: "058-6437171", email: "", lodgingType: "shared", notes: "אירוח אקולוגי מ-2000, ביער אלונים. אוהלים, מטבח משותף, שבילים", mapX: 36, mapY: 27 },
  { name: "ארץ הצבי", region: "מדבר יהודה (ואדי קלט / עין פרת)", website: "https://www.tsvi.co.il", contactName: "", phone: "058-6883020", email: "tsvi546@gmail.com", lodgingType: "shared", notes: "ריזורט גלמפינג מדברי. אוהלים מעוצבים, מדורות, מפל ובריכה", mapX: 46, mapY: 51 },
  { name: "פרויקט נערי האור", region: "הפרחים 4, רשפון (רשת 8 מרכזים)", website: "https://www.youth-of-light.org", contactName: "", phone: "052-3117992", email: "contact@fpp.org.il", lodgingType: "none", notes: "8 מרכזים ברחבי הארץ. מוצרי לייפסטייל ומרחבי יום", mapX: 39, mapY: 41 },
  { name: "אלאיה פולג", region: "חוף פולג, נתניה", website: "https://www.alayapoleg.com", contactName: "", phone: "050-8899788", email: "reception@alayapoleg.com", lodgingType: "room", notes: "מלון וולנס ריזורט. 65 חדרים, יוגה, מדיטציה, סאונד הילינג", mapX: 37, mapY: 38 },
  { name: "לילי עולש", region: "עולש (השרון)", website: "", contactName: "לילי", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית. מומלץ לחפש באינסטגרם / פייסבוק", mapX: 41, mapY: 38 },
  { name: "חווה במאור", region: "מושב מאור, מנשה (ליד חדרה)", website: "", contactName: "", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית שאינה מקודמת דיגיטלית", mapX: 39, mapY: 34 },
  { name: "החווה של סלע", region: "קריית טבעון", website: "", contactName: "סלע", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית שאינה מקודמת אונליין", mapX: 40, mapY: 27 },
  { name: "החווה של יעלי", region: "חדרה", website: "", contactName: "יעלי", phone: "", email: "", lodgingType: "unknown", notes: "חווה פרטית שאינה מקודמת אונליין", mapX: 37, mapY: 33 },
  { name: "קיבוץ לוטן — אקו כיף", region: "ערבה, ליד אילת", website: "https://kibbutzlotan.com", contactName: "דפנה", phone: "08-6356935 / 054-9799030", email: "daphna@klotan.co.il", lodgingType: "room", notes: "כפר נופש אקולוגי, 20 חדרים בטיח אדמה, סדנאות בנייה ירוקה, וואטסו-שיאצו", mapX: 44, mapY: 95 },
  { name: "נאות סמדר", region: "ערבה, דרום הנגב", website: "https://neot-semadar.com", contactName: "", phone: "", email: "", lodgingType: "room", notes: "קיבוץ-קהילה אמנותית, אולם תרגול 65מ\"ר, 18 חדרים + 4 בקתות אקולוגיות, עד כ-60 איש", mapX: 43, mapY: 88 },
  { name: "חוות רום", region: "רכס כמון, נחל צלמון, צפון", website: "https://havatrom.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "ריזורט גלמפינג + ספא + מסעדה מקומית + חווה שיקומית עם עדר עיזים", mapX: 46, mapY: 18 },
  { name: "חוות קשואלה", region: "צפון", website: "https://www.kashuela.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "סדנאות לגופים מגוונים כולל ימי גיבוש; אוהלי קבוצה, טיפי משפחתי, שטח אוהלים", mapX: 45, mapY: 16 },
  { name: "חוות עמק איילון", region: "עמק איילון", website: "https://hea.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "ימי גיבוש וסדנאות למנהלים — תוכנית \"מסלול הערך\"", mapX: 38, mapY: 48 },
  { name: "GLOW Glamping — ארץ הצבי (ואדי פרת)", region: "מדבר יהודה", website: "https://glow-glamping.co.il/resort/zvi-glamping-wadi-prat/", contactName: "", phone: "073-3715222", email: "", lodgingType: "shared", notes: "ריזורט גלמפינג מדברי מעוצב, אירועים פרטיים/עסקיים", mapX: 46, mapY: 51 },
  { name: "GLOW Glamping — כלל האתרים", region: "צפון ומדבר (מגוון אתרים)", website: "https://glow-glamping.co.il", contactName: "", phone: "073-3715222", email: "", lodgingType: "shared", notes: "חברת גלמפינג לאירועי חברה, פופ-אפ ומתחמים קבועים", mapX: 44, mapY: 25 },
  { name: "בראליטו גלמפינג", region: "נייד / אתרים שונים", website: "https://www.barelitoglamping.com", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "השכרה והקמת מתחמי גלמפינג פופ-אפ לאירועים גדולים", mapX: 41, mapY: 45 },
  { name: "נוף צוקים", region: "ים המלח / ערבה", website: "https://nofzuqim.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "ריטריטים במדבר, שקט ותנועה", mapX: 47, mapY: 62 },
  { name: "שיטים וילג'", region: "ערבה", website: "https://retreater.co.il/product/shitim_village/", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "מתחם ריטריטים בסביבה מדברית", mapX: 47, mapY: 70 },
  { name: "יער בראשית", region: "גני יהושע, תל אביב", website: "https://www.gocamping.co.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "מתחם קמפינג/גלמפינג עירוני ליד הירקון", mapX: 40, mapY: 41 },
  { name: "כליל — כפר אקולוגי", region: "גליל מערבי", website: "", contactName: "", phone: "", email: "", lodgingType: "none", notes: "יישוב קהילתי-אקולוגי חילוני. סדנאות אמנות, ריפוי, מוזיקה", mapX: 39, mapY: 12 },
  { name: "עין הוד — כפר אמנים", region: "דרום הכרמל", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "כפר אמנים קהילתי, גלריות, תערוכות, אתרי אירוח כפריים", mapX: 36, mapY: 28 },
  { name: "קיבוץ ענבר — אירוח כפרי", region: "עמק יזרעאל / צפון", website: "https://www.inbar.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מרכז סדנאות, סמינרים וימי עיון; B&B קיבוצי", mapX: 47, mapY: 32 },
  { name: "כפר נופש עין זיוון", region: "רמת הגולן", website: "https://www.enzivan.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "11 בקתות עץ, סיורי חרמון ויקבים, ימי גיבוש עסקיים", mapX: 53, mapY: 12 },
  { name: "קיבוץ מורן", region: "גליל עליון", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מלון קיבוצי קטן, אווירה כפרית שלווה", mapX: 44, mapY: 14 },
  { name: "מדרשת הגולן", region: "רמת הגולן", website: "https://mhg.rgl.org.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "בית הארחה באווירה קיבוצית, מדרשה חינוכית", mapX: 52, mapY: 10 },
  { name: "נוימן — מרכז ויפאסנה יבנאל", region: "יבנאל, הגליל התחתון", website: "https://newmanvipassana.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "מרכז מדיטציה מול מטעי זיתים; חדרי לינה בדרגות שונות", mapX: 47, mapY: 22 },
  { name: "תובנה (ויפאסנה)", region: "מספר אתרים בארץ", website: "https://tovana.org.il", contactName: "", phone: "", email: "", lodgingType: "shared", notes: "ריטריטים ארוכים וקצרים בשיטת גואנקה", mapX: 41, mapY: 46 },
  { name: "Become One — מרכז זן", region: "ישראל (מספר מיקומים)", website: "https://becomeonenow.com", contactName: "תמיר מסאס", phone: "", email: "", lodgingType: "room", notes: "ריטריטי זן ומיינדפולנס", mapX: 40, mapY: 40 },
  { name: "סקולינרי", region: "קיבוץ יגור", website: "https://www.schoolinary.org", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מתחם סדנאות בישול לצוותי מנהלים ועובדים", mapX: 38, mapY: 26 },
  { name: "אקסטרים יער בן שמן", region: "יער בן שמן, מרכז", website: "https://bepaintball.com", contactName: "", phone: "", email: "", lodgingType: "none", notes: "ימי גיבוש בטבע — פיינטבול, הרפתקאות", mapX: 41, mapY: 46 },
  { name: "גיבושטח", region: "ארצי — אתרי טבע שונים", website: "https://gibush-shetach.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "הפקת ימי גיבוש, ריטריטים ופעילויות שטח לחברות", mapX: 50, mapY: 50 },
  { name: "החווה של דני", region: "מרכז / שרון", website: "https://dannysfarm.org.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "חווה טיפולית עם בעלי חיים, סדנאות. דוגמה מנחה ל'ללא לינה'", mapX: 40, mapY: 38 },
  { name: "חוות חוזרים לחיות", region: "מרכז הארץ", website: "https://back2life.org.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "חווה ללוחמים משוחררים; קליניקה, גינה טיפולית, נגרות, יוגה", mapX: 40, mapY: 44 },
  { name: "חוות קרן אור", region: "לא צוין במדויק", website: "https://www.kerenorfarm.com", contactName: "", phone: "", email: "", lodgingType: "none", notes: "מרכז טיפולי-שיקומי עם בעלי חיים בגישת שיקום הדדי", mapX: 50, mapY: 50 },
  { name: "אקו-חי", region: "לא צוין במדויק", website: "https://eco-hai.co.il", contactName: "", phone: "", email: "", lodgingType: "none", notes: "שיקום הדדי אדם-בעל חיים, קבוצות קטנות, קייטנות וסדנאות", mapX: 52, mapY: 50 },
  { name: "נחשולים — ריטריט וולנס", region: "חוף נחשולים, ליד זכרון יעקב", website: "https://findmycenter.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "152 יחידות אירוח בדרגות שונות, יוגה ותנועה, הרצאות וסדנאות", mapX: 35, mapY: 31 },
  { name: "מרכז סורנטו וולנס", region: "מספר סניפים", website: "https://healthvacations.co.il", contactName: "", phone: "", email: "", lodgingType: "room", notes: "רשת ריטריטי וולנס", mapX: 41, mapY: 40 },
  { name: "סתלבט", region: "צפון (מיקום קיבוצי)", website: "", contactName: "", phone: "", email: "", lodgingType: "room", notes: "כפר נופש בקיבוץ, מדורג מהמומלצים בארץ", mapX: 45, mapY: 20 },
];

/** Venues where only the name is known — no site/contact/location found. */
export const NAME_ONLY_SEED = [
  { name: "חוות טללי אביב", sourceNote: "אוזכר בחיפוש כללי, לא נמצא אתר/פרטים מדויקים" },
  { name: "חוות שקד", sourceNote: "אוזכר לצד פארק סיירת שקד בנגב, לא אומת כמתחם אירוח" },
  { name: "צליל בגליל — כפר שמאי", sourceNote: "נמצא כצימר בגליל עליון; לא אומת התאמה לאירועי חברה" },
  { name: "תמר גלמפינג", sourceNote: "נמצא כספק אוהלי גלמפינג למכירה — לא בהכרח מתחם פעיל, דורש בירור" },
];
