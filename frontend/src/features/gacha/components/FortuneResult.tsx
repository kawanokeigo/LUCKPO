import type { Fortune } from "../types";

type FortuneResultProps = {
  fortune: Fortune;
  onCreatePost: () => void;
};

export default function FortuneResult({ fortune, onCreatePost }: FortuneResultProps) {
  return (
    <section className={`fortune-result fortune-result--${fortune.id}`} aria-live="polite">
      <div className="fortune-result__opened-capsule" aria-hidden="true">
        <span className="fortune-result__capsule-half fortune-result__capsule-half--top" />
        <span className="fortune-result__capsule-half fortune-result__capsule-half--bottom" />
      </div>
      <p className="fortune-result__fortune">{fortune.name}</p>
      <p className="fortune-result__probability">出現確率 {fortune.probability}</p>
      <p className="fortune-result__message">{fortune.message}</p>
      <div className="fortune-result__actions">
        <button className="fortune-result__post" type="button" onClick={onCreatePost}>
          この内容で投稿する
        </button>
      </div>
    </section>
  );
}
