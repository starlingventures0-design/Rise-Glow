import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Category = "face" | "hair" | "body";

interface Recipe {
  title: string;
  ingredients: string[];
  steps: string[];
}

const RECIPES: Record<Category, Recipe[]> = {
  face: [
    {
      title: "ماسك العسل والزبادي للترطيب",
      ingredients: ["2 ملعقة كبيرة زبادي طبيعي", "1 ملعقة كبيرة عسل"],
      steps: [
        "اخلطي العسل مع الزبادي جيداً حتى يتجانس الخليط",
        "وزّعي الخليط على وجه نظيف وجاف",
        "اتركيه 15 دقيقة ثم اغسليه بماء فاتر",
      ],
    },
    {
      title: "ماسك الشوفان لتفتيح البشرة",
      ingredients: ["2 ملعقة كبيرة شوفان مطحون", "1 ملعقة كبيرة حليب", "قطرات ليمون"],
      steps: [
        "اخلطي الشوفان مع الحليب حتى يصبح عجينة ناعمة",
        "أضيفي قطرات الليمون وقلّبي",
        "دلّكي الوجه بالخليط بحركات دائرية لطيفة",
        "اتركيه 10 دقائق ثم اشطفيه",
      ],
    },
    {
      title: "ماسك الطين لتنقية البشرة الدهنية",
      ingredients: ["2 ملعقة طين مغربي أو طين أخضر", "ماء ورد حسب الحاجة"],
      steps: [
        "اخلطي الطين مع ماء الورد حتى يصبح قوامه كريمي",
        "ضعيه على الوجه بعيداً عن العين",
        "اتركيه حتى يجف تماماً (حوالي 15 دقيقة)",
        "اشطفيه بماء فاتر وضعي مرطب بعدها",
      ],
    },
    {
      title: "ماسك الموز لبشرة ناعمة",
      ingredients: ["نصف موزة ناضجة", "1 ملعقة صغيرة عسل"],
      steps: [
        "اهرسي الموزة جيداً حتى تصبح ناعمة بدون تكتلات",
        "أضيفي العسل واخلطي",
        "ضعيه على الوجه لمدة 15-20 دقيقة",
        "اغسليه بماء فاتر",
      ],
    },
  ],
  hair: [
    {
      title: "ماسك زيت جوز الهند للترطيب العميق",
      ingredients: ["2 ملعقة كبيرة زيت جوز الهند"],
      steps: [
        "سخّني الزيت قليلاً بين يديك",
        "دلّكي فروة الرأس والأطراف بالزيت",
        "غطي شعرك بمنشفة دافئة أو كاب استحمام",
        "اتركيه ساعة على الأقل (أو ليلة كاملة) ثم اغسليه بالشامبو",
      ],
    },
    {
      title: "ماسك البيض لتقوية الشعر",
      ingredients: ["1 بيضة", "1 ملعقة كبيرة زيت زيتون"],
      steps: [
        "اخفقي البيضة مع زيت الزيتون جيداً",
        "وزّعي الخليط على الشعر من الجذور للأطراف",
        "اتركيه 20-30 دقيقة",
        "اغسليه بماء فاتر (وليس ساخن حتى لا يتخثر البيض) ثم شامبو",
      ],
    },
    {
      title: "ماسك الموز والعسل للامعان",
      ingredients: ["1 موزة ناضجة", "2 ملعقة كبيرة عسل", "1 ملعقة زيت زيتون"],
      steps: [
        "اهرسي الموز جيداً وأضيفي العسل وزيت الزيتون",
        "اخلطي حتى يتجانس الخليط تماماً",
        "وزّعيه على الشعر بالكامل",
        "اتركيه 30 دقيقة ثم اغسليه جيداً",
      ],
    },
    {
      title: "ماسك الصبار لتهدئة فروة الرأس",
      ingredients: ["3 ملاعق كبيرة جل صبار طبيعي"],
      steps: [
        "دلّكي فروة الرأس بجل الصبار مباشرة",
        "وزّعي الباقي على طول الشعر",
        "اتركيه 30 دقيقة",
        "اغسليه بشامبو خفيف",
      ],
    },
  ],
  body: [
    {
      title: "سكراب السكر وزيت الزيتون",
      ingredients: ["3 ملاعق كبيرة سكر بني", "2 ملعقة كبيرة زيت زيتون"],
      steps: [
        "اخلطي السكر مع زيت الزيتون حتى يتكون خليط متماسك",
        "دلّكي الجسم بحركات دائرية خصوصاً المناطق الجافة",
        "اتركيه دقيقتين ثم اشطفيه بماء دافئ",
      ],
    },
    {
      title: "ماسك الشوكولاتة المرطب للجسم",
      ingredients: ["3 ملاعق كاكاو خام", "2 ملعقة عسل", "1 ملعقة زيت جوز الهند"],
      steps: [
        "اخلطي كل المكونات حتى تحصلي على عجينة ناعمة",
        "وزّعيها على الجسم وخصوصاً الأماكن الجافة",
        "اتركيها 15 دقيقة",
        "اشطفيها بماء دافئ",
      ],
    },
    {
      title: "زيت اللافندر للاسترخاء بعد الاستحمام",
      ingredients: ["3 ملاعق زيت لوز", "5 قطرات زيت لافندر عطري"],
      steps: [
        "اخلطي الزيتين جيداً بزجاجة صغيرة",
        "بعد الاستحمام مباشرة وجسمك رطب قليلاً، دلّكي الجسم بالخليط",
        "هذا يرطب البشرة ويساعد على الاسترخاء قبل النوم",
      ],
    },
    {
      title: "ماسك الطين للجسم في أيام الحر",
      ingredients: ["4 ملاعق طين مغربي", "ماء بارد حسب الحاجة"],
      steps: [
        "اخلطي الطين بالماء حتى يصبح قوامه كريمي خفيف",
        "ضعيه على الجسم واتركيه حتى يجف نصفياً",
        "اشطفيه بماء فاتر، يترك إحساس بالانتعاش والنظافة",
      ],
    },
  ],
};

const CATEGORY_LABELS: Record<Category, { title: string; icon: string }> = {
  face: { title: "ماسكات الوجه", icon: "🌸" },
  hair: { title: "ماسكات الشعر", icon: "💆‍♀️" },
  body: { title: "ماسكات الجسم", icon: "🛁" },
};

export default function RaniaRecipesPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("face");

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-violet-50 pb-16">
      <header className="pt-6 pb-4 px-4">
        <button onClick={() => navigate(-1)} className="text-violet-500 text-sm mb-2">
          → رجوع
        </button>
        <h1 className="text-xl font-bold text-violet-700 text-center">وصفات رانيا 🌿</h1>
        <p className="text-rose-500 text-sm text-center mt-1">
          ماسكات طبيعية لوجهك وشعرك وجسمك
        </p>
      </header>

      <div className="flex gap-2 px-4 mb-5 max-w-md mx-auto">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex-1 rounded-full py-2 text-sm font-medium flex items-center justify-center gap-1 ${
              category === key
                ? "bg-gradient-to-r from-rose-400 to-violet-400 text-white shadow-md"
                : "bg-white text-violet-600 border border-rose-100"
            }`}
          >
            <span>{CATEGORY_LABELS[key].icon}</span>
            {CATEGORY_LABELS[key].title}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">
        {RECIPES[category].map((recipe, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4"
          >
            <h3 className="font-semibold text-violet-700 mb-2">{recipe.title}</h3>

            <p className="text-xs text-rose-500 font-medium mb-1">المكونات:</p>
            <ul className="text-sm text-gray-600 mb-3 space-y-0.5">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>• {ing}</li>
              ))}
            </ul>

            <p className="text-xs text-rose-500 font-medium mb-1">طريقة التحضير:</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              {recipe.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
  }
