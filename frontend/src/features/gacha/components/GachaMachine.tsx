type GachaMachineProps = { isDrawing: boolean };

export default function GachaMachine({ isDrawing }: GachaMachineProps) {
  return (
    <div className={`gacha-machine${isDrawing ? " is-drawing" : ""}`} aria-label="運勢ガチャマシン">
      <img
        className="gacha-machine__image"
        src="/images/gacha-machine.png"
        alt="黄色いガチャマシン。窓の中にカプセルが入っています。"
      />
    </div>
  );
}
