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

  let gameRunning = false;


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

    //let swipeStarted = false;
    let shootStarted = false;

    window.addEventListener(`touchmove`, e => {
      e.preventDefault();
      if (gameRunning && e.touches[0].clientX < (window.innerWidth / 2) + 30 && e.touches[0].clientX > (window.innerWidth / 2) - 30 && !shootStarted) {
        const mappedClientY = mapRange(e.touches[0].clientY, windowRange.min, windowRange.max, threeRange.min, threeRange.max);
        plane.move(mappedClientY);
      }
    });

    window.addEventListener(`touchstart`, e => {
      e.preventDefault();
      if (gameRunning && !shootStarted) {
        //swipeStarted = true;
        touchstartX = e.changedTouches[0].screenX;
      }
    }, false);

    window.addEventListener(`touchend`, e => {
      e.preventDefault();
      if (gameRunning && e.changedTouches[0].screenX < touchstartX - 100 && !shootStarted) {
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
      if (planeBack) {
        const restart = plane.restart();
        restart.onComplete(() => {
          shootStarted = false;
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

  const gameStarted = () => {
    if (!document.getElementById(`connect-box`).classList.contains(`invisible`)) {
      document.getElementById(`connect-box`).classList.add(`invisible`);
    }
    countDown();
    setTimeout(() => {
      gameRunning = true;
    }, 3000);
    gameRunning = true;
  };

  const countDown = () => {
    const $countDown = document.getElementById(`count-down`);
    if ($countDown.classList.contains(`invisible`)) {
      $countDown.classList.remove(`invisible`);
    }
    let teller = 3;
    $countDown.innerHTML = teller;
    const interval = setInterval(() => {
      teller -= 1;
      $countDown.innerHTML = teller;
      if (teller === 0) {
        clearInterval(interval);
        $countDown.classList.add(`invisible`);
      }
    }, 1000);
  };

  const connectSocket = () => {
    socket = IO.connect(`/`);

    socket.on(`sid`, ({sid}) => {
      socket.emit(`connected`, targetId, {
        message: `connection succesfull`,
        remoteId: sid
      });
    });

    socket.on(`start`, () => {
      gameStarted();
    });

    socket.on(`pause`, () => {
      gameRunning = false;
      document.getElementById(`paused-controller`).classList.remove(`invisible`);
    });

    socket.on(`restart`, () => {
      gameRunning = true;
      document.getElementById(`paused-controller`).classList.add(`invisible`);
    });

    socket.on(`gameover`, () => {
      gameRunning = false;
      document.getElementById(`gameover-controller`).classList.remove(`invisible`);
    });

    socket.on(`softrestart`, () => {
      document.getElementById(`gameover-controller`).classList.add(`invisible`);
    });
  };


  init();

};

export default controller;
