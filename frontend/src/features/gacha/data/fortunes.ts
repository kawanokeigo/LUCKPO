import type { Fortune } from "../types";

export const fortunes: Fortune[] = [
  {
    id: "daikyo",
    name: "大凶",
    subtitle: "今日は慎重にいこう",
    message: "思いがけないことが起きるかも。今日はゆっくり確認しながら進もう。",
    kind: "unluck",
    probability: "5%",
    weight: 5,
  },
  {
    id: "kyo",
    name: "凶",
    subtitle: "小さな休憩が吉",
    message: "ちょっと空回りしそうな日。無理せずマイペースがいちばん。",
    kind: "unluck",
    probability: "15%",
    weight: 15,
  },
  {
    id: "kichi",
    name: "吉",
    subtitle: "いつもの一日を大切に",
    message: "大きな変化はなくても、いつもの日常にいいことがありそう。",
    kind: "luck",
    probability: "15%",
    weight: 15,
  },
  {
    id: "chukichi",
    name: "中吉",
    subtitle: "いい流れがやってくる",
    message: "気になっていたことに挑戦すると、うれしい発見があるかも。",
    kind: "luck",
    probability: "25%",
    weight: 25,
  },
  {
    id: "shokichi",
    name: "小吉",
    subtitle: "小さな幸運を見つけよう",
    message: "身近なところに、うれしいことが見つかりそう。焦らず過ごしてみよう。",
    kind: "luck",
    probability: "35%",
    weight: 35,
  },
  {
    id: "daikichi",
    name: "大吉",
    subtitle: "今日は主役の日！",
    message: "最高の運気！思い切って動けば、忘れられない一日になりそう。",
    kind: "luck",
    probability: "5%",
    weight: 5,
  },
];

export function drawFortune() {
  const totalWeight = fortunes.reduce((sum, fortune) => sum + fortune.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const fortune of fortunes) {
    roll -= fortune.weight;
    if (roll < 0) return fortune;
  }

  return fortunes[fortunes.length - 1];
}
