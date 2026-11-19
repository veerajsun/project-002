"use client";

import { useEffect, useState } from "react";

export default function ProductBilingualInfo() {
  const [lang, setLang] = useState<"en" | "hi">("en");

  // Read URL query parameter or localStorage if available on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang");
      if (urlLang === "hi" || urlLang === "en") {
        setLang(urlLang);
        return;
      }
      const stored = window.localStorage.getItem("sabaland_lang");
      if (stored === "hi" || stored === "en") {
        setLang(stored);
      }
    } catch {
      // safe fallback
    }
  }, []);

  function handleSwitch(next: "en" | "hi") {
    setLang(next);
    try {
      window.localStorage.setItem("sabaland_lang", next);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // safe fallback
    }
  }

  return (
    <section
      id="product-information"
      className="w-full border-t border-gray-200/80 bg-white py-12 lg:py-18"
      aria-labelledby="product-info-heading"
    >
      <div className="mx-auto max-w-store px-6 lg:px-12">
        {/* Section Header & Language Toggle */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-gray-200 pb-8 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                {lang === "en" ? "Complete Product Information" : "संपूर्ण उत्पाद जानकारी"}
              </span>
              <span className="h-1 w-1 rounded-full bg-honey-500" />
              <span className="text-xs font-semibold text-charcoal-500">
                {lang === "en" ? "Bilingual Guide" : "हिंदी और अंग्रेज़ी"}
              </span>
            </div>
            <h2
              id="product-info-heading"
              className="font-serif text-2xl text-charcoal-900 sm:text-3xl lg:text-4xl"
            >
              {lang === "en"
                ? "Yemeni Honey Khalta – Natural Vitality & Men’s Wellness"
                : "यमनी हनी खलता – पुरुषों के स्वास्थ्य, स्टैमिना और प्राकृतिक ऊर्जा का संपूर्ण विवरण"}
            </h2>
          </div>

          {/* Prominent Language Switcher Tabs */}
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
              {lang === "en" ? "Select Language" : "भाषा चुनें"}
            </span>
            <div
              role="tablist"
              aria-label="Language options"
              className="inline-flex rounded-xl border border-gray-300 bg-gray-100 p-1 shadow-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={lang === "en"}
                aria-controls="panel-en"
                id="tab-en"
                onClick={() => handleSwitch("en")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  lang === "en"
                    ? "bg-charcoal-900 text-white shadow-md ring-1 ring-charcoal-900"
                    : "text-charcoal-700 hover:text-charcoal-900 hover:bg-white/60"
                }`}
              >
                <span>English</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={lang === "hi"}
                aria-controls="panel-hi"
                id="tab-hi"
                onClick={() => handleSwitch("hi")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  lang === "hi"
                    ? "bg-charcoal-900 text-white shadow-md ring-1 ring-charcoal-900"
                    : "text-charcoal-700 hover:text-charcoal-900 hover:bg-white/60"
                }`}
              >
                <span>हिंदी (Hindi)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ENGLISH PANEL (Original English version)                      */}
        {/* ============================================================== */}
        <div
          id="panel-en"
          role="tabpanel"
          aria-labelledby="tab-en"
          className={lang === "en" ? "block space-y-12 pt-10" : "hidden"}
        >
          {/* 1. What is Yemeni Honey Khalta? */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                  Product Overview & Heritage
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal-900 sm:text-2xl">
                  What is Yemeni Honey Khalta?
                </h3>
              </div>
              <p className="text-[15px] leading-relaxed text-charcoal-700">
                Sabland Yemeni Honey Khalta is a prized, traditional Arabian botanical
                formulation combining authentic, unprocessed Yemeni mountain honey with
                time-honored natural herbs. In the folk wellness heritage of Yemen and
                the Arabian peninsula, Khalta has been cherished for generations as a
                nourishing, restorative tonic crafted to support daily strength, physical
                vigor, and sustained vitality.
              </p>
              <p className="text-[15px] leading-relaxed text-charcoal-700">
                Unlike synthetic stimulants or mass-produced alternatives, genuine
                Yemeni honey serves as a nutrient-dense, bioavailable foundation. Its
                natural enzymatic properties and rich carbohydrate composition deliver
                steady nourishment, supporting the body’s innate resilience against
                physical fatigue and everyday burnout.
              </p>
              <p className="text-[15px] leading-relaxed text-charcoal-700">
                Sabland brings authentic Yemeni honey harvested from pristine mountain flora
                and valleys directly to homes across India. Each batch is prepared under
                strict hygiene standards and delivered in 100% discreet packaging.
              </p>
            </div>

            {/* 2. Four Feature Cards (English) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">spa</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  Pure Mountain Honey
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  Harvested from mountain flora, providing rich micronutrients, bioavailable enzymes, and steady natural energy.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">fitness_center</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  Physical Stamina
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  Designed as a daily wellness addition to counter routine physical and mental exhaustion while sustaining natural stamina.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  Traditional Heritage
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  Rooted in centuries-old Middle Eastern restorative traditions to nurture male vitality, vigor, and bedroom confidence.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  100% Discreet Delivery
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  Shipped across India in secure, unmarked packaging with Cash on Delivery for absolute privacy.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Men's Vitality, Energy & Intimate Wellness */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 lg:p-8 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
              Male Wellness & Vitality
            </span>
            <h3 className="font-serif text-xl font-bold text-charcoal-900 sm:text-2xl">
              Men’s Vitality, Energy & Intimate Wellness
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-6 text-[15px] leading-relaxed text-charcoal-700 md:grid-cols-2">
              <p>
                Modern lifestyle factors—including long working hours, chronic workplace
                stress, irregular sleep patterns, and physical fatigue—frequently take
                a toll on adult men’s energy levels, endurance, and bedroom confidence.
                Common concerns such as feelings of male weakness, premature fatigue,
                difficulty maintaining stamina or firmness, reduced libido, and nightfall
                or physical exhaustion are often deeply connected to general vitality deficits
                and nutrient depletion.
              </p>
              <p>
                Yemeni Honey Khalta is formulated specifically within the category of
                natural men’s wellness. By delivering a blend of wholesome carbohydrates,
                enzymes, and traditional botanical compounds, it helps replenish natural
                stamina and vigor. It is intended to support men seeking to sustain
                active physical endurance, restorative energy, and peace of mind in their
                everyday and intimate lives.
              </p>
            </div>
          </div>

          {/* 4. Specifications & Facts Table (English) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-serif text-lg font-bold text-charcoal-900">
              Product Overview at a Glance
            </h4>
            <dl className="mt-4 divide-y divide-gray-100 text-sm">
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">Product</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">Sabland Yemeni Honey Khalta</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">Category</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">Natural Men's Wellness & Vitality Formulation</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">Origin & Heritage</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">Yemeni Mountain Honey with Traditional Herbs</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">Packaging</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">100% Discreet, Sealed & Tamper-Evident</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">Shipping & Payment</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">Free Delivery Across India · Cash on Delivery Only</dd>
              </div>
            </dl>
          </div>

          {/* 5. How to Use Responsibly & Understanding Natural Wellness */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-4 lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                Usage Guidance
              </span>
              <h3 className="font-serif text-xl font-bold text-charcoal-900 sm:text-2xl">
                How to Use Responsibly
              </h3>
              <p className="text-[15px] leading-relaxed text-charcoal-700">
                For optimal experience, Khalta should be incorporated consistently into
                a healthy evening routine rather than treated as an instant quick fix:
              </p>
              <ul className="space-y-3.5 text-sm text-charcoal-800">
                <li className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-honey-600">
                    check_circle
                  </span>
                  <div>
                    <strong>Dosage:</strong> Take one teaspoon of Khalta honey daily, preferably at night (about 30 to 45 minutes before sleep).
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-honey-600">
                    check_circle
                  </span>
                  <div>
                    <strong>With warm milk:</strong> Follow your spoonful with a warm glass of milk to support gentle digestion and nutrient absorption.
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-honey-600">
                    check_circle
                  </span>
                  <div>
                    <strong>Consistency:</strong> Best used consistently as part of a balanced diet, adequate hydration, and restorative sleep.
                  </div>
                </li>
              </ul>
            </div>

            {/* Responsible Wellness Box */}
            <div className="rounded-xl border border-amber-200/80 bg-honey-50/50 p-6 lg:col-span-5 space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-honey-800">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Understanding Natural Wellness
              </h4>
              <p className="text-xs leading-relaxed text-charcoal-700 sm:text-sm">
                Natural formulations operate through gradual, holistic nourishment.
                Individual response varies according to personal constitution, diet, age,
                and lifestyle. Sabland does not make unrealistic claims of instantaneous
                performance changes or 3-day miracle cures; our focus is genuine traditional quality
                and honest nutritional support for sustained wellness.
              </p>
            </div>
          </div>

          {/* 6. Medical Disclaimer (English) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-5 text-xs leading-relaxed text-charcoal-600">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-charcoal-900">
              <span className="material-symbols-outlined text-[16px] text-honey-600">
                info
              </span>
              Medical Disclaimer & Safety Guidance
            </div>
            <p className="mt-2">
              Sabland Yemeni Honey Khalta is a natural dietary and herbal wellness preparation.
              It is <strong>not a medicine</strong>, drug, or pharmaceutical product, and is
              not intended to diagnose, treat, mitigate, cure, or prevent any clinical condition
              or disease, including clinical erectile dysfunction, premature ejaculation,
              infertility, hormonal disorders, or related medical diagnoses. It does not
              guarantee specific timelines or results. The information presented here is solely
              for educational and general wellness awareness. If you suffer from chronic health
              issues, allergies to honey or bee products, or persistent sexual wellness
              concerns, please consult a qualified healthcare professional or physician.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* HINDI PANEL (100% Complete, Natural & Expanded Translation)   */}
        {/* ============================================================== */}
        <div
          id="panel-hi"
          role="tabpanel"
          aria-labelledby="tab-hi"
          className={lang === "hi" ? "block space-y-12 pt-10" : "hidden"}
        >
          {/* 1. What is Yemeni Honey Khalta? (Hindi) */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                  पारंपरिक परिचय एवं विशेषताएं
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal-900 sm:text-2xl">
                  यमनी हनी खलता क्या है और इसका पारंपरिक महत्व क्या है?
                </h3>
              </div>

              <p className="text-[15px] leading-relaxed text-charcoal-700">
                सबलैंड यमनी हनी खलता (Sabland Yemeni Honey Khalta) एक अत्यंत प्रतिष्ठित और
                प्राचीन अरब हर्बल फॉर्मूलेशन है, जिसे प्रामाणिक, असंसाधित (unprocessed) यमनी पहाड़ी
                शहद और सदियों से आजमाई हुई पारंपरिक जड़ी-बूटियों के अनूठे संगम से तैयार किया जाता है।
                मध्य पूर्व, विशेषकर यमन के पहाड़ी क्षेत्रों में खलता को पीढ़ियों से एक ऐसा पौष्टिक
                और शरीर में नई जान फूंकने वाला प्राकृतिक टॉनिक माना गया है, जो पुरुषों के दैनिक जीवन में
                आवश्यक शारीरिक शक्ति, स्वाभाविक स्फूर्ति और निरंतर बनी रहने वाली पौरुष ऊर्जा प्रदान करता है।
              </p>

              <p className="text-[15px] leading-relaxed text-charcoal-700">
                बाजार में मिलने वाले कृत्रिम उत्तेजक रसायनों या तुरंत असर का खोखला दावा करने वाले
                सस्ते विकल्पों के विपरीत, असली यमनी शहद शरीर को एक सुरक्षित, प्राकृतिक और पोषक
                तत्वों से भरपूर आधार देता है। इस शहद में मौजूद प्राकृतिक पाचक एंजाइम्स, एंटीऑक्सिडेंट्स
                और धीरे-धीरे ऊर्जा देने वाले कार्बोहाइड्रेट्स शरीर की आंतरिक कोशिकाओं को गहरा पोषण
                प्रदान करते हैं। यह निरंतर पोषण शरीर की आंतरिक रोग-सहनशीलता और मांसपेशियों की ताकत को
                मजबूत करता है, जिससे दैनिक भागदौड़, काम के तनाव और शारीरिक थकावट से मुकाबला करने में मदद मिलती है।
              </p>

              <p className="text-[15px] leading-relaxed text-charcoal-700">
                सबलैंड आपके लिए यमन की प्राचीन पहाड़ियों और घाटियों से प्राप्त यह मूल शहद सीधे आपके घर तक
                पहुंचाता है। यह उत्पाद किसी भी प्रकार के हानिकारक केमिकल, कृत्रिम रंग या प्रिजर्वेटिव्स से
                पूरी तरह मुक्त है। यह केवल एक मीठा शहद नहीं है, बल्कि पुरुषों के संपूर्ण स्वास्थ्य, शारीरिक स्टैमिना
                और आत्मविश्वास को स्वाभाविक रूप से पोषित करने वाला एक संपूर्ण दैनिक स्वास्थ्य आहार है।
              </p>
            </div>

            {/* 2. Four Feature Cards (Hindi) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 transition-all hover:border-gray-300">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">spa</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  शुद्ध यमनी पहाड़ी शहद
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  यमन की ऊंची पहाड़ियों और प्राकृतिक वनस्पतियों से संकलित, जो सूक्ष्म पोषक तत्वों, खनिजों और शुद्ध प्राकृतिक ऊर्जा से भरपूर है।
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 transition-all hover:border-gray-300">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">fitness_center</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  शारीरिक स्टैमिना व स्फूर्ति
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  दैनिक जीवन की लगातार शारीरिक और मानसिक थकान को दूर कर कार्यक्षमता, सक्रियता और स्टैमिना को बनाए रखने में सहायक।
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 transition-all hover:border-gray-300">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  अरब परंपरा की ऐतिहासिक विरासत
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  सदियों पुरानी पारंपरिक चिकित्सा पद्धतियों पर आधारित, जो पुरुषों के आंतरिक पौरुष बल और आत्मविश्वास को स्वाभाविक रूप से मजबूती देती है।
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 transition-all hover:border-gray-300">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-50 text-honey-600">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-charcoal-900">
                  100% गोपनीय व सुरक्षित डिलीवरी
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  पूर्ण गोपनीयता के साथ सादे और सुरक्षित पार्सल में पूरे भारत में डिलीवरी, साथ ही कैश ऑन डिलीवरी (COD) की आसान सुविधा।
                </p>
              </div>
            </div>
          </div>

          {/* 3. Men's Vitality, Energy & Intimate Wellness (Hindi) */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 lg:p-9 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                पुरुषों का पौरुष स्वास्थ्य एवं जीवनशैली
              </span>
              <h3 className="font-serif text-xl font-bold text-charcoal-900 sm:text-2xl lg:text-3xl">
                पुरुषों का स्वास्थ्य, आंतरिक स्टैमिना और आत्मविश्वास
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 text-[15px] leading-relaxed text-charcoal-700 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-charcoal-900">
                  आधुनिक जीवनशैली, तनाव और पुरुषों की आम समस्याएं
                </h4>
                <p>
                  आज की आधुनिक और अत्यधिक व्यस्त जीवनशैली में पुरुषों को भारी मानसिक और शारीरिक
                  दबाव का सामना करना पड़ता है। कार्यक्षेत्र की लंबी शिफ्ट्स, दफ्तर का तनाव, आर्थिक
                  चिंताएं, अनियमित दिनचर्या और अधूरी नींद सीधे तौर पर पुरुषों के आंतरिक स्वास्थ्य,
                  हार्मोनल संतुलन और ऊर्जा स्तर को प्रभावित करती हैं।
                </p>
                <p>
                  यही कारण है कि अनेक पुरुष शारीरिक कमजोरी, जल्दी थक जाने, मर्दाना कमजोरी का अहसास,
                  स्टैमिना या इरेक्शन व दृढ़ता बनाए रखने में कठिनाई, यौन इच्छा (लिबिडो) में कमी,
                  तथा शीघ्रपतन (premature exhaustion) या स्वप्नदोष (nightfall) जैसी चिंताओं का सामना करते हैं।
                  स्वास्थ्य विशेषज्ञों के अनुसार, अधिकांश मामलों में ये समस्याएं किसी बीमारी के कारण नहीं,
                  बल्कि शरीर में गहरे पोषण की कमी, तनाव और लगातार बनी रहने वाली शारीरिक व मानसिक थकान का परिणाम होती हैं।
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-bold text-charcoal-900">
                  खलता किस प्रकार प्राकृतिक रूप से सहायक बनता है?
                </h4>
                <p>
                  सबलैंड यमनी हनी खलता को विशेष रूप से पुरुषों के संपूर्ण स्वास्थ्य (Men’s Holistic
                  Wellness) की श्रेणी में तैयार किया गया है। यह कोई कृत्रिम उत्तेजक दवा नहीं है,
                  बल्कि शुद्ध शहद और पारंपरिक जड़ी-बूटियों का एक प्राकृतिक पौष्टिक टॉनिक है।
                </p>
                <p>
                  इसके नियमित सेवन से शरीर को प्राकृतिक कार्बोहाइड्रेट्स, पाचक एंजाइम्स और हर्बल
                  अर्क मिलते हैं, जो रक्त संचार और आंतरिक ऊर्जा को स्वाभाविक पोषण प्रदान करते हैं।
                  यह शरीर की कमजोरी को कम करने, मांसपेशियों में शक्ति का संचार करने और दैनिक
                  कार्यक्षमता को बढ़ाने में मदद करता है। इसके सेवन से पुरुष अपने सामान्य कामकाज
                  में भी अधिक सक्रिय महसूस करते हैं और अपने निजी व वैवाहिक जीवन में खोया हुआ
                  आत्मविश्वास, शांति और स्वाभाविक पौरुष ऊर्जा फिर से अनुभव कर सकते हैं।
                </p>
              </div>
            </div>
          </div>

          {/* 4. Specifications & Facts Table (Hindi) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-serif text-lg font-bold text-charcoal-900">
              उत्पाद का संक्षिप्त परिचय एवं मुख्य विशेषताएं (At a Glance)
            </h4>
            <dl className="mt-4 divide-y divide-gray-100 text-sm">
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">उत्पाद का नाम</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">सबलैंड यमनी हनी खलता (Sabland Yemeni Honey Khalta)</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">उत्पाद श्रेणी</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">पुरुषों का प्राकृतिक स्वास्थ्य, पौरुष बल एवं पोषण आहार</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">मूल स्रोत एवं परंपरा</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">शुद्ध यमनी पहाड़ी शहद और प्राचीन पारंपरिक जड़ी-बूटियों का संगम</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">पैकेजिंग व गोपनीयता</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">100% गोपनीय, सीलबंद और सुरक्षित पैकेजिंग</dd>
              </div>
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-charcoal-500">डिलीवरी एवं भुगतान</dt>
                <dd className="font-semibold text-charcoal-900 sm:text-right">पूरे भारत में निःशुल्क डिलीवरी · केवल कैश ऑन डिलीवरी (COD)</dd>
              </div>
            </dl>
          </div>

          {/* 5. How to Use Responsibly & Understanding Natural Wellness (Hindi) */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                  प्रामाणिक सेवन विधि
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal-900 sm:text-2xl">
                  सेवन की सही विधि और जिम्मेदार उपयोग
                </h3>
              </div>

              <p className="text-[15px] leading-relaxed text-charcoal-700">
                खलता का सर्वोत्तम और स्थायी अनुभव प्राप्त करने के लिए इसे किसी तात्कालिक जादुई दवा
                की तरह नहीं, बल्कि अपनी नियमित शाम और रात की स्वास्थ्य दिनचर्या का हिस्सा बनाकर
                उपयोग करना चाहिए। पारंपरिक अरब चिकित्सा के अनुसार, रात के समय शरीर विश्राम की
                अवस्था में होता है, जिससे शहद और जड़ी-बूटियों के पोषक तत्व शरीर में गहराई से
                अवशोषित हो पाते हैं:
              </p>

              <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-honey-600">
                    check_circle
                  </span>
                  <div className="text-sm">
                    <strong className="text-charcoal-900">दैनिक उचित मात्रा (Daily Dosage):</strong>
                    <p className="mt-0.5 leading-relaxed text-charcoal-600">
                      रोजाना रात को सोने से पहले एक चम्मच खलता शहद का सीधे सेवन करें (सोने से लगभग 30 से 45 मिनट पहले)। इसे मुंह में रखकर धीरे-धीरे निगलें ताकि इसका स्वाद और प्राकृतिक पोषक तत्व अच्छी तरह महसूस हों।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-honey-600">
                    check_circle
                  </span>
                  <div className="text-sm">
                    <strong className="text-charcoal-900">गुनगुने दूध का सेवन (With Warm Milk):</strong>
                    <p className="mt-0.5 leading-relaxed text-charcoal-600">
                      खलता शहद लेने के ठीक बाद एक गिलास गुनगुना दूध पिएं। गुनगुना दूध पाचन तंत्र को सक्रिय करता है, शहद की प्राकृतिक ऊर्जा को संतुलित करता है और पोषण को शरीर की कोशिकाओं तक तेजी से पहुंचाने में मदद करता है।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-honey-600">
                    check_circle
                  </span>
                  <div className="text-sm">
                    <strong className="text-charcoal-900">नियमितता और स्वस्थ आदतें (Consistency & Lifestyle):</strong>
                    <p className="mt-0.5 leading-relaxed text-charcoal-600">
                      अधिकतम लाभ के लिए इसे अपनी दैनिक जीवनशैली का हिस्सा बनाएं। इसके साथ-साथ पौष्टिक घर का खाना खाएं, दिनभर पर्याप्त पानी पिएं, तंबाकू या शराब से परहेज करें और कम से कम 7-8 घंटे की गहरी नींद लें।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Responsible Wellness Box (Hindi) */}
            <div className="rounded-xl border border-amber-200/80 bg-honey-50/60 p-6 lg:col-span-5 space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-honey-800">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                प्राकृतिक पोषण के सिद्धांत को समझें
              </h4>
              <p className="text-xs leading-relaxed text-charcoal-700 sm:text-sm">
                प्राकृतिक हर्बल और शहद आधारित उत्पाद शरीर में धीरे-धीरे, सुरक्षित रूप से और संपूर्ण
                तरीके से कार्य करते हैं। हर व्यक्ति की शारीरिक संरचना (metabolism), आयु, मानसिक
                तनाव का स्तर और दैनिक खान-पान अलग होता है, इसलिए इसके अनुभव और समय में स्वाभाविक
                भिन्नता हो सकती है।
              </p>
              <p className="text-xs leading-relaxed text-charcoal-700 sm:text-sm">
                सबलैंड किसी भी प्रकार के अवास्तविक, तुरंत असर करने वाले या 3 दिनों के झूठे दावों
                का कड़ा विरोध करता है। हमारा विश्वास शुद्ध, पारंपरिक गुणवत्ता और सच्चे पोषण में
                है, ताकि आपको बिना किसी दुष्प्रभाव के दीर्घकालिक आंतरिक शक्ति और स्वास्थ्य प्राप्त हो सके।
              </p>
            </div>
          </div>

          {/* 6. Medical Disclaimer (Hindi) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/95 p-6 text-xs leading-relaxed text-charcoal-600 space-y-2">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-charcoal-900 text-sm">
              <span className="material-symbols-outlined text-[18px] text-honey-600">
                info
              </span>
              स्वास्थ्य संबंधी आवश्यक अस्वीकरण एवं सुरक्षा परामर्श (Medical Disclaimer)
            </div>
            <p>
              सबलैंड यमनी हनी खलता एक प्राकृतिक हर्बल एवं खाद्य पूरक (Dietary & Herbal Wellness Preparation)
              है। यह कोई एलोपैथिक, रासायनिक या डॉक्टरी <strong>दवा नहीं है</strong> और न ही यह स्थायी
              नपुंसकता / इरेक्टाइल डिसफंक्शन (Erectile Dysfunction), गंभीर शीघ्रपतन (Premature Ejaculation),
              स्वप्नदोष, बांझपन (Infertility), या किसी भी हार्मोनल विकार के पूर्ण इलाज (Cure) का दावा करता है।
              इसे चिकित्सीय रोग के निदान, रोकथाम या डॉक्टरी इलाज के विकल्प के रूप में पेश नहीं किया गया है।
            </p>
            <p>
              यह उत्पाद किसी तय समय सीमा या निश्चित परिणामों की गारंटी नहीं देता। यहां दी गई समस्त
              जानकारी केवल सामान्य स्वास्थ्य जागरूकता, पोषण समझ और पारंपरिक ज्ञान के उद्देश्य से
              प्रदान की गई है और इसे किसी भी स्थिति में पेशेवर डॉक्टरी सलाह का विकल्प न समझें। यदि आप
              मधुमक्खी उत्पादों या शहद से एलर्जी रखते हैं, मधुमेह (Diabetes) या किसी गंभीर पुरानी बीमारी
              से पीड़ित हैं, या आपकी यौन स्वास्थ्य संबंधी समस्याएं लंबे समय से गंभीर रूप से बनी हुई हैं,
              तो कृपया किसी योग्य डॉक्टर या स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
