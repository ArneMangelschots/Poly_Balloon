const THREE = require('three');
const TWEEN = require('tween.js');

export default class Balloon extends THREE.Mesh {

  constructor(geometry, materials, sceneWidthModifier) {
    super(geometry, materials);
    this.position.set(sceneWidthModifier * -1.4, -175, - 600);
    this.scale.set(.4, .4, .4);
    this.rotation.order = `ZYX`;
    this.castShadow = true;
    this.reveiveShadow = true;
    this.body = new THREE.Box3().setFromObject(this);
    this.gravityY = .4;
    this.alive = true;
  }

  wiggle = () => {
    this.rotation.x = 15 * (Math.PI / 180);
    const start = {x: this.rotation.x};
    const target = {x: - 15 * (Math.PI / 180)};
    const tween = new TWEEN.Tween(start).to(target, 1000);
    tween.easing(TWEEN.Easing.Sinusoidal.InOut);
    tween.yoyo(true);
    tween.repeat(Infinity);
    tween.start();
    tween.onUpdate(() => {
      this.alive ? `nothing` : tween.stop();
      this.rotation.x = start.x;
      this.updateMatrix();
      this.body.setFromObject(this);
    });
  }

  flyUp = () => {
      const position = {x: this.position.x, y: this.position.y};
      const target = {x: this.position.x, y: this.position.y + 80};
      const tween = new TWEEN.Tween(position).to(target, 500);
      tween.easing(TWEEN.Easing.Exponential.Out);
      tween.start();
      tween.onUpdate(() => {
        this.alive ? `nothing` : tween.stop();
        this.position.y = position.y;
        this.updateMatrix();
        this.body.setFromObject(this);
      });
    return tween;
  }

  flyToStart = () => {
    const position = {y: this.position.y};
    const target = {y: this.position.y + 350};
    const tween = new TWEEN.Tween(position).to(target, 3000);
    tween.easing(TWEEN.Easing.Cubic.Out);
    tween.start();
    tween.onUpdate(() => {
      this.position.y = position.y;
      this.updateMatrix();
      this.body.setFromObject(this);
    });
    return tween;
  };

  fall = speed => {
    this.position.y -= speed * this.gravityY;
    this.updateMatrix();
    this.body.setFromObject(this);
    if(this.position.y <= -185){
      this.balloonDeath();
    }
  }

  hit = () => {
    const start = {z: this.rotation.z};
    const target = {z: 30 * (Math.PI / 180)};
    const tween = new TWEEN.Tween(start).to(target, 250);
    tween.easing(TWEEN.Easing.Quartic.Out);
    tween.yoyo(true);
    tween.start();
    tween.onUpdate(() => {
      this.rotation.z = start.z;
      this.updateMatrix();
      this.body.setFromObject(this);
    });
    tween.onComplete(() => {
      const start = {z: this.rotation.z};
      const target = {z: 0 * (Math.PI / 180)};
      const tween = new TWEEN.Tween(start).to(target, 400);
      tween.easing(TWEEN.Easing.Quintic.In);
      tween.yoyo(true);
      tween.start();
      tween.onUpdate(() => {
        this.rotation.z = start.z;
        this.updateMatrix();
        this.body.setFromObject(this);
      });
    })
  }

  balloonDeath = () => {
    this.gravityY = 0;
    this.alive = false;
  }

  reset = () => {
    this.alive = true;
    this.gravityY = .4;
  }
}
