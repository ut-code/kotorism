import MultiElementCard from "@/components/my-notebooks/MultiElement";

const FACES: { label: string; value: string }[] = [
  { label: "見出し語", value: "literature" },
  { label: "意味", value: "文学" },
  { label: "発音", value: "/ˈlɪdər(ə)tʃər/" },
];

export function StudyModePreview() {
  const faces = FACES.map(({ label, value }) => {
    const isPronunciation = label === "発音";
    return (
      <div key={label} className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
          {label}
        </span>
        <span
          className={`font-semibold text-black dark:text-zinc-50 ${
            isPronunciation ? "whitespace-nowrap" : "text-2xl"
          }`}
          style={isPronunciation ? { fontSize: "clamp(0.65rem, 3vw, 1.25rem)" } : undefined}
        >
          {value}
        </span>
      </div>
    );
  });

  return (
    <div className="relative z-10 overflow-hidden rounded-2xl border border-coral-200/70 dark:border-coral-900/30">
      <p className="border-b border-coral-200/70 bg-coral-50/60 px-5 py-2 text-xs font-medium text-coral-800 dark:border-coral-900/30 dark:bg-coral-950/20 dark:text-coral-300">
        暗記学習モード
      </p>
      <div className="flex justify-center bg-white p-4 dark:bg-zinc-900">
        <MultiElementCard
          faces={faces}
          columnNames={FACES.map((f) => f.label)}
          width={190}
          height={125}
          showHint={false}
        />
      </div>
    </div>
  );
}
