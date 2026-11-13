import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator < 0) return [line.trim(), ""];
      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""),
      ];
    }),
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("frontend/.env.local にSupabaseのURLと公開キーを設定してください。");
}

const accounts = [
  {
    name: "さくら",
    handle: "sakura_m",
    bio: "カフェ巡りと散歩が好きです。",
    posts: [
      ["luck", "低確率", "帰りに寄ったパン屋で、最後の塩パン買えた。ちょっと得した気分。"],
      ["unluck", "20%", "傘を持って出るか迷って置いてきたら、帰りにちょうど降られた。"],
      ["luck", "0.8%", "久しぶりにガチャを一回だけ引いたら、欲しかった子が来てくれた！"],
      ["luck", "高確率", "駅前のカフェが空いてた。窓際の席でゆっくりできてうれしい。"],
      ["unluck", "確率不明", "買ったばかりのリップをポーチの中で開けちゃってた。今日はついてないかも。"],
    ],
  },
  {
    name: "ゆう",
    handle: "yuu_days",
    bio: "ゲームと音楽のことをたまに書きます。",
    posts: [
      ["luck", "50%", "コンビニのくじ、欲しかったマグカップが当たった。使うの楽しみ。"],
      ["unluck", "低確率", "イヤホン片方だけ家に忘れてきた。通学中ずっと片耳。"],
      ["luck", "高確率", "電車で座れたので、読みかけの本を少し進められた。"],
      ["unluck", "10%", "楽しみにしてた限定メニュー、目の前で売り切れになった。"],
      ["luck", "ほぼ確実", "友達がすすめてくれた曲がめちゃくちゃ好みだった。しばらくリピートする。"],
    ],
  },
  {
    name: "たくみ",
    handle: "takumi_7",
    bio: "ゲームしたり、たまに料理したり。",
    posts: [
      ["luck", "3%", "商店街の抽選でドリンク券もらえた。こういうの当たると地味にうれしい。"],
      ["unluck", "確率不明", "朝から寝ぐせが直らなくて、結局帽子でごまかした。"],
      ["luck", "高確率", "冷蔵庫に材料が残ってたから、思いつきで作ったパスタがうまくいった。"],
      ["unluck", "50%", "充電したつもりがケーブル刺さってなかった。出先で気づいて焦った。"],
      ["luck", "0.8%", "欲しかったアイテム、まさかの一回目で出た。今日はもう何も引かない。"],
    ],
  },
  {
    name: "みお",
    handle: "mio_sora",
    bio: "おいしいものと旅行が好きです。",
    posts: [
      ["luck", "高確率", "帰り道にきれいな夕焼け見れた。写真より実物のほうがよかったな。"],
      ["unluck", "20%", "天気予報を見ずに洗濯物を干したら、夕方に雨。やってしまった。"],
      ["luck", "50%", "二択で迷ったランチ、選んだほうが当たりだった。次もここにしよう。"],
      ["unluck", "低確率", "電車乗った瞬間に忘れ物に気づいた。取りに戻る時間はなかった…。"],
      ["luck", "ほぼ確実", "予約いっぱいだと思ってたお店、キャンセルが出て入れた！"],
    ],
  },
  {
    name: "れん",
    handle: "ren11",
    bio: "休日は散歩かゲームしてます。",
    posts: [
      ["luck", "高確率", "いつも混んでるラーメン屋、今日は並ばず入れた。ラッキー。"],
      ["unluck", "低確率", "朝、家を出てから鍵を机に置いたままだと気づいた。ギリギリ戻れた。"],
      ["luck", "1%", "応募してたライブの追加席、当選してた。通知見て一気に目が覚めた。"],
      ["unluck", "50%", "洗濯した靴下、片方だけ見つからない。どこ行ったんだろう。"],
      ["luck", "高確率", "帰りに自販機で当たりが出た。もう一本は友達にあげた。"],
    ],
  },
  {
    name: "あおい",
    handle: "aoi_days",
    bio: "日々の小さなことをメモしてます。",
    posts: [
      ["luck", "2%", "ずっと探してた本が古本屋で見つかった。しかも状態きれい。"],
      ["unluck", "確率不明", "お気に入りの傘を電車に置き忘れた。問い合わせてみる…。"],
      ["luck", "高確率", "友達からちょうど連絡が来て、帰りに一緒にごはん行けた。"],
      ["unluck", "20%", "雨は降らないと思って自転車で出たら、帰る時間に降ってきた。"],
      ["luck", "0.8%", "ゲームの無料分でレアが出た！こういう日があるからやめられない。"],
    ],
  },
  {
    name: "りく",
    handle: "riku_22",
    bio: "スポーツ観戦とカレーが好き。",
    posts: [
      ["luck", "高確率", "たまたま入った定食屋のカレーが大当たり。また行きたい。"],
      ["unluck", "50%", "出かける直前にスマホの充電が少ないことに気づいた。モバイルバッテリー持ってて助かった。"],
      ["luck", "ほぼ確実", "久々に会った友達と話が止まらなくて、気づいたら閉店時間だった。"],
      ["unluck", "低確率", "楽しみにしてた試合、最後の最後で逆転負け。しばらく立ち直れない。"],
      ["luck", "5%", "応募してたチケットが当選！まさか本当に行けると思ってなかった。"],
    ],
  },
  {
    name: "はるか",
    handle: "haruka_s",
    bio: "旅行の写真を撮るのが好きです。",
    posts: [
      ["luck", "高確率", "乗り換えが全部スムーズで、予定より早く着いた。余裕あるっていいね。"],
      ["unluck", "10%", "駅に着いたらちょうど電車が出たところだった。あと一分早ければ…。"],
      ["luck", "50%", "旅行先で入ったお店、地元の人におすすめ聞いたら大正解だった。"],
      ["unluck", "確率不明", "写真撮ろうとした瞬間にスマホの容量不足。整理してから出ればよかった。"],
      ["luck", "ほぼ確実", "帰りの新幹線、窓側の席が取れた。景色見ながら帰れてよかった。"],
    ],
  },
  {
    name: "けんた",
    handle: "kenta_5",
    bio: "新しいお店を見つけるのが好きです。",
    posts: [
      ["luck", "高確率", "ずっと気になってた喫茶店に行けた。プリンが固めで最高。"],
      ["unluck", "低確率", "家を出てから財布を忘れたことに気づいた。電子マネー使えて助かった。"],
      ["luck", "3%", "レシートのキャンペーン、当たると思わず応募したらクーポン届いた。"],
      ["unluck", "50%", "買ったばかりの白い服にコーヒーこぼした。すぐ拭いたから少しだけセーフ。"],
      ["luck", "高確率", "帰りに寄ったスーパーで好きなお菓子が安くなってた。まとめ買い。"],
    ],
  },
  {
    name: "なな",
    handle: "nana_days",
    bio: "カフェと映画の記録。",
    posts: [
      ["luck", "高確率", "映画館でちょうどいい席が空いてた。予告からしっかり楽しめた。"],
      ["unluck", "20%", "楽しみにしてた映画、上映時間を一時間勘違いしてた。次の回に間に合ってよかった。"],
      ["luck", "0.8%", "ガチャで欲しかった色違いが出た！スクショして友達に送った。"],
      ["unluck", "確率不明", "カフェで頼んだドリンク、ストローなしで持ち帰りにしてしまった。"],
      ["luck", "50%", "帰りに寄り道するか迷ったけど、して正解。かわいい雑貨見つけた。"],
    ],
  },
];

let createdAccounts = 0;
let createdPosts = 0;

for (const [index, account] of accounts.entries()) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) throw new Error(`${account.name}のアカウント作成に失敗しました: ${authError.message}`);
  if (!authData.user) throw new Error(`${account.name}のアカウント情報を取得できませんでした。`);
  createdAccounts += 1;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      handle: account.handle,
      display_name: account.name,
      bio: account.bio,
      is_onboarded: true,
    })
    .eq("id", authData.user.id);
  if (profileError) throw new Error(`${account.name}のプロフィール設定に失敗しました: ${profileError.message}`);

  const rows = account.posts.map(([kind, probability, body]) => ({
    user_id: authData.user.id,
    kind,
    probability,
    body,
  }));
  const { data: insertedPosts, error: postsError } = await supabase
    .from("posts")
    .insert(rows)
    .select("id");
  if (postsError) throw new Error(`${account.name}の投稿登録に失敗しました: ${postsError.message}`);
  createdPosts += insertedPosts?.length ?? 0;
  console.log(`${index + 1}/10 ${account.name}: ${insertedPosts?.length ?? 0}件登録`);
}

console.log(`完了: アカウント${createdAccounts}個、投稿${createdPosts}件を登録しました。`);
