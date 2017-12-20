const THREE = require('three');
const TWEEN = require('tween.js');

export default class Balloon extends THREE.Mesh {

  constructor(geometrys, materials, sceneWidthModifier) {
    super(geometrys[0], materials);
    this.geometrys = geometrys;
    this.dmgCounter = 0;
    this.position.set(sceneWidthModifier * -1.4, -200, - 600);
    this.scale.set(.48, .48, .48);
    this.rotation.order = `ZYX`;
    this.castShadow = true;
    this.reveiveShadow = true;
    this.body = new THREE.Box3().setFromObject(this);
    this.gravityY = .3;
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
      console.log(`up`, this.position.y);
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
        if(this.position.y > 400) {
          this.position.y = 380;
        }
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
    if(this.position.y <= -210){
      this.balloonDeath();
    }
  }

  hit = () => {
    if(this.dmgCounter < 4){
      this.dmgCounter += 1;
    }else{
      this.dmgCounter = 4;
    }
    this.gravityY += .15;
    this.geometry = this.geometrys[this.dmgCounter];
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
    this.dmgCounter = 0;
    this.geometry = this.geometrys[0];
  }
}
