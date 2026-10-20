import { useEffect, useState } from "react";

type ProbabilityMode = "direct" | "consecutive" | "binomial" | "compound" | "preset";
type Outcome = "hit" | "miss";

type ProbabilityInputProps = {
  onProbabilityChange: (value: string) => void;
};

const modes: { value: ProbabilityMode; label: string }[] = [
  { value: "direct", label: "直接入力" },
  { value: "consecutive", label: "n回連続 p%" },
  { value: "binomial", label: "n回中m回 p%" },
  { value: "compound", label: "p%とq%が重なった" },
  { value: "preset", label: "文字から選択" },
];

function parseNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatProbability(value: number) {
  const rounded = Number(value.toPrecision(8));
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function combination(n: number, r: number) {
  const count = Math.min(r, n - r);
  let result = 1;
  for (let index = 1; index <= count; index += 1) {
    result = (result * (n - count + index)) / index;
  }
  return result;
}

export default function ProbabilityInput({ onProbabilityChange }: ProbabilityInputProps) {
  const [mode, setMode] = useState<ProbabilityMode>("direct");
  const [probability, setProbability] = useState("20");
  const [secondProbability, setSecondProbability] = useState("20");
  const [trials, setTrials] = useState("10");
  const [occurrences, setOccurrences] = useState("1");
  const [outcome, setOutcome] = useState<Outcome>("hit");
  const [preset, setPreset] = useState("低確率");

  const p = parseNumber(probability);
  const q = parseNumber(secondProbability);
  const trialCount = parseNumber(trials);
  const occurrenceCount = parseNumber(occurrences);
  let calculatedProbability: string;

  if (mode === "preset") {
    calculatedProbability = preset;
  } else if (p === null || p < 0 || p > 100) {
    calculatedProbability = "—";
  } else if (mode === "direct") {
    calculatedProbability = `${formatProbability(p)}%`;
  } else if (mode === "consecutive") {
    if (trialCount === null || trialCount < 1 || !Number.isInteger(trialCount)) {
      calculatedProbability = "—";
    } else {
      const chance = outcome === "hit" ? p / 100 : 1 - p / 100;
      calculatedProbability = `${formatProbability(chance ** trialCount * 100)}%`;
    }
  } else if (mode === "binomial") {
    if (
      trialCount === null ||
      occurrenceCount === null ||
      trialCount < 1 ||
      !Number.isInteger(trialCount) ||
      !Number.isInteger(occurrenceCount) ||
      occurrenceCount < 0 ||
      occurrenceCount > trialCount
    ) {
      calculatedProbability = "—";
    } else {
      const chance = outcome === "hit" ? p / 100 : 1 - p / 100;
      const missChance = 1 - chance;
      const result =
        combination(trialCount, occurrenceCount) *
        chance ** occurrenceCount *
        missChance ** (trialCount - occurrenceCount) *
        100;
      calculatedProbability = `${formatProbability(result)}%`;
    }
  } else if (q === null || q < 0 || q > 100) {
    calculatedProbability = "—";
  } else {
    calculatedProbability = `${formatProbability((p * q) / 100)}%`;
  }

  useEffect(() => {
    onProbabilityChange(calculatedProbability);
  }, [calculatedProbability, onProbabilityChange]);

  return (
    <div className="probability-input">
      <label className="probability-input__mode-label" htmlFor="probability-mode">
        確率入力方式選択
      </label>
      <div className="probability-input__box">
        <div className="probability-input__select-wrap">
          <select
            id="probability-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as ProbabilityMode)}
          >
            {modes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="probability-input__panel">
          {mode === "direct" && (
            <div className="probability-input__row">
              <input
                aria-label="確率パーセント"
                className="probability-input__number"
                inputMode="decimal"
                min="0"
                max="100"
                placeholder="20"
                type="number"
                value={probability}
                onChange={(event) => setProbability(event.target.value)}
              />
              <span className="probability-input__unit">%</span>
            </div>
          )}

          {mode === "consecutive" && (
            <>
              <div className="probability-input__row">
                <input
                  aria-label="連続回数"
                  className="probability-input__number"
                  inputMode="numeric"
                  min="1"
                  placeholder="回数"
                  type="number"
                  value={trials}
                  onChange={(event) => setTrials(event.target.value)}
                />
                <span className="probability-input__unit">回連続</span>
              </div>
              <div className="probability-input__row">
                <input
                  aria-label="事象の確率"
                  className="probability-input__number probability-input__number--compact"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  type="number"
                  value={probability}
                  onChange={(event) => setProbability(event.target.value)}
                />
                <span className="probability-input__unit">%が</span>
                <select
                  className="probability-input__outcome"
                  aria-label="当たり・外れ"
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value as Outcome)}
                >
                  <option value="hit">当たった</option>
                  <option value="miss">外れた</option>
                </select>
              </div>
            </>
          )}

          {mode === "binomial" && (
            <>
              <div className="probability-input__row">
                <input
                  aria-label="試行回数"
                  className="probability-input__number probability-input__number--small"
                  inputMode="numeric"
                  min="1"
                  type="number"
                  value={trials}
                  onChange={(event) => setTrials(event.target.value)}
                />
                <span className="probability-input__unit">回中</span>
                <input
                  aria-label="当たりまたは外れの回数"
                  className="probability-input__number probability-input__number--small"
                  inputMode="numeric"
                  min="0"
                  type="number"
                  value={occurrences}
                  onChange={(event) => setOccurrences(event.target.value)}
                />
                <span className="probability-input__unit">回</span>
              </div>
              <div className="probability-input__row">
                <input
                  aria-label="事象の確率"
                  className="probability-input__number probability-input__number--compact"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  type="number"
                  value={probability}
                  onChange={(event) => setProbability(event.target.value)}
                />
                <span className="probability-input__unit">%が</span>
                <select
                  className="probability-input__outcome"
                  aria-label="当たり・外れ"
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value as Outcome)}
                >
                  <option value="hit">当たった</option>
                  <option value="miss">外れた</option>
                </select>
              </div>
            </>
          )}

          {mode === "compound" && (
            <>
              <div className="probability-input__row">
                <input
                  aria-label="1つ目の確率"
                  className="probability-input__number probability-input__number--compact"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  type="number"
                  value={probability}
                  onChange={(event) => setProbability(event.target.value)}
                />
                <span className="probability-input__unit">%と</span>
                <input
                  aria-label="2つ目の確率"
                  className="probability-input__number probability-input__number--compact"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  type="number"
                  value={secondProbability}
                  onChange={(event) => setSecondProbability(event.target.value)}
                />
                <span className="probability-input__unit">%が</span>
              </div>
              <p className="probability-input__compound-label">重なった</p>
            </>
          )}

          {mode === "preset" && (
            <select
              className="probability-input__preset"
              aria-label="確率の表記"
              value={preset}
              onChange={(event) => setPreset(event.target.value)}
            >
              <option>超低確率</option>
              <option>低確率</option>
              <option>高確率</option>
              <option>超高確率</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
