const THREE = require('three');

export default class Landscape extends THREE.Mesh {

  constructor(geometry, materials, x, y, z) {
    super(geometry, materials);
    this.position.set(x, y, z);
    this.scale.set(.8, .8, .8);
    this.rotation.y = - 90 * (Math.PI / 180);
    this.castShadow = true;
    this.receiveShadow = true;
    this.body = new THREE.Box3().setFromObject(this);
  }

  move(speed, mover) {
    this.position.x -= speed;
    this.body.setFromObject(this);
  }

  reset(x) {
    this.position.x = (x+600);
    this.body.setFromObject(this);
  };

}
