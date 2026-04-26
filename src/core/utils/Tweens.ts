export function debugActiveTweens(scene: Phaser.Scene) {
  const tweens = scene.tweens.getTweens(); // array di tutti i tween attivi
  console.log(`🔎 Tween attivi: ${tweens.length}`);

  /* tweens.forEach((tween, index) => {
    console.log(
      `#${index} → Targets: ${tween.data.map(d => d.constructor.name).join(', ')} | Progress: ${(tween.progress * 100).toFixed(1)}% | Playing: ${tween.isPlaying()}`
    );
  }); */
}