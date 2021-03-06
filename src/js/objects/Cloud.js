import random from '../lib/random';
const THREE = require('three');

export default class Cloud extends THREE.Mesh {

  constructor(geometrys, materials, x, y, z, speeder) {
    super(geometrys[0], materials);
    this.geometry = geometrys[Math.round(random(0,2))];
    this.position.set(x, y, z);
    this.scale.set(.5, .5, .5);
    this.rotation.y = - 90 * (Math.PI / 180);
    this.castShadow = true;
    this.receiveShadow = true;
    this.speeder = speeder;
    this.yPos = y;
    this.xPos = x;
    this.zPos = z;
  }

  move(speed, frustum) {
    this.position.x -= speed + 1 * this.speeder;
  }

  reset() {
    this.position.set(this.xPos, this.yPos, this.zPos);
    this.speeder = random(.9, 1.1);
  }

}
