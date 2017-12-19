const THREE = require(`three`);
const TWEEN = require(`tween.js`);
import IO from 'socket.io-client';
import getUrlParameter from './lib/getUrlParameter';
import mapRange from './lib/mapRange';
//three
import modelLoader from './objects/modelLoader';
import MobilePaperPlane from './objects/MobilePaperPlane';

const controller = () => {

  const objectsToLoad = [`paperPlane`];

  let models = false;

  let scene,
    camera,
    threeHeightModifier,
    renderer,
    frustum;

  let socket,
    targetId;

  let maxHeight = 0;

  const gameStarted = true;


  const init = () => {

    maxHeight = window.innerHeight;
    console.log(maxHeight);
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      console.log(`goe ze`);
    } else {
      // document.getElementById(`no-mobile`).classList.remove(`invisible`);
      // return false;
    }

    targetId = getUrlParameter(`id`);
    if (!targetId) {
      console.log(`something went wrong`);
      return;
    }

    modelLoader.loadJSON(objectsToLoad)
    .then(m => {
      models = m;
      setupGameController();
    });

    connectSocket();
  };

  const setupGameController = () => {
    setupThree();
    setupLights();
    setupController();
  };

  const setupThree = () => {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.z = 600;
    camera.position.y = 0;
    camera.position.x = 0;

    camera.updateMatrix();
    camera.updateMatrixWorld();

    frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    threeHeightModifier = frustum.planes[0].constant;

    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    const $gameElement = document.getElementById(`plane-controller`);
    if ($gameElement) {
      $gameElement.appendChild(renderer.domElement);
    } else {
      return;
    }
  };

  const setupLights = () => {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.color.setHSL(1, .5, 1);
    hemiLight.groundColor.setHSL(1, 1, 1);
    hemiLight.position.set(0, 0, - 100);
    scene.add(hemiLight);
  };

  const setupController = () => {
    setupPaperPlane();
    render();
  };

  const setupPaperPlane = () => {
    const paperPlane = new MobilePaperPlane(models.paperPlane.geometry, models.paperPlane.materials);
    paperPlane.scale.set(.9, .9, .9);
    scene.add(paperPlane);
    handlePlaneShooting(paperPlane);
  };

  const handlePlaneShooting = plane => {
    const threeRange = {min: threeHeightModifier * 2.3, max: threeHeightModifier * - 2.3};
    const windowRange = {min: 0, max: maxHeight};

    let touchstartX = 0;

    let swipeStarted = false;
    let shootStarted = false;

    window.addEventListener(`touchmove`, e => {
      e.preventDefault();
      if (gameStarted && !swipeStarted && e.touches[0].clientX < (window.innerWidth / 2) + 30 && e.touches[0].clientX > (window.innerWidth / 2) - 30 && !shootStarted) {
        const mappedClientY = mapRange(e.touches[0].clientY, windowRange.min, windowRange.max, threeRange.min, threeRange.max);
        plane.move(mappedClientY);
      }
    });

    window.addEventListener(`touchstart`, e => {
      e.preventDefault();
      if (e.changedTouches[0].screenX > (window.innerWidth / 2) + 30 && !swipeStarted && !shootStarted) {
        swipeStarted = true;
        touchstartX = e.changedTouches[0].screenX;
      }
    }, false);

    window.addEventListener(`touchend`, e => {
      e.preventDefault();
      if (e.changedTouches[0].screenX < touchstartX - (window.innerWidth / 2) && swipeStarted && !shootStarted) {
        shootStarted = true;
        const shooting = plane.shoot();
        socket.emit(`shoot`, targetId, {
          yPos: plane.position.y,
          min: threeRange.min,
          max: threeRange.max
        });
        shooting.onComplete(() => {
          plane.reset();
        });
      }
    }, false);

    socket.on(`planeback`, ({planeBack}) => {
      document.getElementById(`debugger`).innerHTML = `joepie`;
      if (planeBack) {
        const restart = plane.restart();
        restart.onComplete(() => {
          shootStarted = false;
          swipeStarted = false;
        });
      }
    });

  };


  const render = () => {
    renderer.render(scene, camera);
    TWEEN.update();
    window.requestAnimationFrame(render);
  };

  // const handleGesture = () => {
  //   if (touchendX <= touchstartX) {
  //     socket.emit(`update`, targetId, {
  //       gestureX: `left`,
  //       y: touchendY
  //     });
  //   }
  //
  //   if (touchendX >= touchstartX) {
  //     socket.emit(`update`, targetId, {gestureX: `right`});
  //   }
  // };

  const connectSocket = () => {
    socket = IO.connect(`/`);

    socket.on(`sid`, ({sid}) => {
      socket.emit(`connected`, targetId, {
        message: `connection succesfull`,
        remoteId: sid
      });
    });

    socket.on(`start`, ({message}) => {
      console.log(message);
    });
  };


  init();

};

export default controller;
