const THREE = require(`three`);
import IO from 'socket.io-client';
import getUrlParameter from './lib/getUrlParameter';
//three
import modelLoader from './objects/modelLoader';
import MobilePaperPlane from './objects/MobilePaperPlane';

const controller = () => {

  const objectsToLoad = [`paperPlane`];

  let models = false;

  let scene,
    camera,
    renderer;

  let socket,
    targetId;

  let touchstartX = 0;
  let touchendX = 0;
  let touchendY = 0;


  const init = () => {

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      console.log(`Mobile device is true!`);
    } else {
      //document.getElementById(`no-mobile`).classList.remove(`invisible`);
      //return false;
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
    eventListeners();
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
    scene.add(paperPlane);
  };


  const render = () => {
    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  };

  const eventListeners = () => {
    window.addEventListener(`touchstart`, e => {
      touchstartX = e.changedTouches[0].screenX;
    }, false);

    window.addEventListener(`touchend`, e => {
      touchendX = e.changedTouches[0].screenX;
      touchendY = e.changedTouches[0].screenY;
      handleGesture();
    }, false);
  };

  const handleGesture = () => {
    if (touchendX <= touchstartX) {
      socket.emit(`update`, targetId, {
        gestureX: `left`,
        y: touchendY
      });
    }

    if (touchendX >= touchstartX) {
      socket.emit(`update`, targetId, {gestureX: `right`});
    }
  };

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
