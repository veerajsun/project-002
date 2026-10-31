// Steps copied from the "HOW TO USE" section on sabaland.in product pages
const STEPS = [
  {
    n: "01",
    title: "Take a spoonful",
    text: "Enjoy one teaspoon of Khalta honey directly, preferably in the night.",
  },
  {
    n: "02",
    title: "Warm milk",
    text: "After having Khalta, have a glass of warm milk.",
  },
  {
    n: "03",
    title: "Make it daily",
    text: "For best results, make it a part of your daily routine.",
  },
];

export default function HowToUse() {
  return (
    <section
      id="how-to-use"
      className="w-full scroll-mt-32 border-b border-gray-100 bg-white py-16"
    >
      <div className="mx-auto max-w-store px-6 lg:px-12">
        <div className="mx-auto max-w-2xl space-y-2 pb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
            A simple ritual for everyday wellness
          </span>
          <h2 className="font-serif text-3xl text-charcoal-900 sm:text-4xl">
            How to Use Sabland Khalta
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50 p-6"
            >
              <div className="font-serif text-3xl font-bold text-honey-500/70">{s.n}</div>
              <h3 className="font-serif text-lg font-bold text-charcoal-900">{s.title}</h3>
              <p className="text-xs leading-relaxed text-charcoal-600">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
