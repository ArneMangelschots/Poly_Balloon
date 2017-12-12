const THREE = require('three');

export default class Treeline extends THREE.Mesh {

  constructor(geometry, materials, x, y, z) {
    super(geometry, materials);
    this.position.set(x, y, z);
    this.rotation.y = - 90 * (Math.PI / 180);
    this.scale.set(.8, .8, .8);
    this.castShadow = true;
    this.receiveShadow = true;
  }

  move(speed) {
    this.position.x -= speed;
    if (this.position.x <= - 1700) {
      this.position.x = + 2400;
    }
  }

}
