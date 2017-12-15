const THREE = require('three');

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

  // shoot() {
  //   this.position.x -= 7;
  //   this.updateMatrix();
  //   this.body.setFromObject(this);
  // }
  //
  // reset() {
  //   this.position.set(800, 150, - 600);
  //   this.updateMatrix();
  //   this.body.setFromObject(this);
  //   this.flying = false;
  // }

}
