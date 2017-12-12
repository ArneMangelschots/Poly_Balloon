const THREE = require('three');
const loader = new THREE.JSONLoader();

let req;

export default {

  load: () => {
    const toLoad = [`landscape1`,`landscape2`, `landscape3`, `balloon`, `cloud`, `cloud1`, `cloud2`, `treeline`, `paperPlane`];
    let models = {};
    const loader = new THREE.JSONLoader();
    let req;

    return new Promise((resolve, reject) => {
      toLoad.forEach(m => {
        loader.load(`./assets/models/${m}.json`, (geometry, materials) => {
          const model = {
            [m]: {
              geometry: geometry,
              materials: materials
            }
          };
          models = Object.assign(models, model);
        });
      });
      THREE.DefaultLoadingManager.onLoad = () => {
        if (Object.keys(models).length === toLoad.length) {
          resolve(models);
        }
      };
      setTimeout(() => {
        if (Object.keys(models).length !== toLoad.length) {
          reject(`network error`);
        }
      }, 30000);
    });

  }
};
