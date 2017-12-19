const THREE = require('three');
const TWEEN = require('tween.js');

export default class MobilePaperPlane extends THREE.Mesh {

  constructor(geometry, materials) {
    super(geometry, materials);
    this.position.set(0, 0, - 600);
    this.scale.set(.4, .4, .4);
    this.rotation.y = - 90 * (Math.PI / 180);
    this.castShadow = true;
    this.receiveShadow = true;
    this.flying = false;
  }

  move(y) {
    this.position.y = y;
  }

  shoot() {
    const position = {x: this.position.x};
    const target = {x: -500};
    const tween = new TWEEN.Tween(position).to(target, 600);
    tween.easing(TWEEN.Easing.Exponential.Out);
    tween.start();
    tween.onUpdate(() => {
      this.position.x = position.x;
    });
    return tween;
  };

  restart() {
    const position = {x: this.position.x};
    const target = {x: 0};
    const tween = new TWEEN.Tween(position).to(target, 600);
    tween.easing(TWEEN.Easing.Exponential.Out);
    tween.start();
    tween.onUpdate(() => {
      this.position.x = position.x;
    });
    return tween;
  }

  reset() {
    this.position.x = 500;
    this.position.y = 0;
  }

}
