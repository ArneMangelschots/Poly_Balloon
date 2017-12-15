const THREE = require('three');
const loader = new THREE.JSONLoader();

let req;

export default {

  loadJSON: (toLoad) => {
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
      }, 100000);
    });

  },

  loadObject: (toLoad) => {
    let models = {};
    const loader = new THREE.ObjectLoader();
    let req;

    return new Promise((resolve, reject) => {
      toLoad.forEach(m => {
        loader.load(`./assets/models/${m}.json`, (s) => {
          const scene = {
            [m]: {
              scene: s,
            }
          };
          models = Object.assign(models, scene);
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
      }, 100000);
    });

  }
};
