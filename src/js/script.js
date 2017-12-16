import mapRange from './lib/mapRange';
import autoCorrelate from './lib/autoCorrelate';
import random from './lib/random';
import getUrlParameter from './lib/getUrlParameter';

import modelLoader from './objects/modelLoader';
import Balloon from './objects/Balloon';
import Landscape from './objects/Landscape';
import Cloud from './objects/Cloud';
import PaperPlane from './objects/PaperPlane';

import controller from './controller';

const THREE = require('three');
const TWEEN = require('tween.js');
import IO from 'socket.io-client';

{
  const SHADOW_MAP_WIDTH = 2048
  const SHADOW_MAP_HEIGHT = 1024;

  const toLoad = [`landscape1`,`landscape2`, `landscape3`, `balloon`, `cloud`, `cloud1`, `cloud2`, `treeline`, `paperPlane`];

  let scene = false,
    camera = false,
    renderer = false,
    frustum = false,
    sceneWidthModifier = false;

  let models = false,
    landscapes = [],
    clouds = [],
    balloon = false,
    paperPlanes = [];

  let speed = 0,
    audioCtx,
    analyser,
    pitch = false,
    myPitch = 20000,
    pitchUp = false;

  let socket,
      socketId,
      remoteSocketId;

  const buflen = 1024,
    buf = new Float32Array(buflen);

  const init = () => {
    if (getUrlParameter(`page`) === `controller`) {
      controller();
      return false;
    }

    connectSocket();
    handleAudio();
    //load all models
    modelLoader.loadJSON(toLoad)
    .then(m => {
      models = m;
      game();
    });
    //get audiostream
  };

  const game = () => {
    setupThree();
    setupLights();
    setupWorld();
  };

  const render = () => {
    TWEEN.update();
    //init WebGLRenderer
    renderer.render(scene, camera);

    checkBalloonDeath();
    moveWorld();
    checkPaperPlanes();

    window.requestAnimationFrame(render);
  };

  const checkBalloonDeath = () => {
    if(!balloon.alive){
      gameOver();
      return;
    }else{
      balloon.fall(speed);
    }
  };

  const checkPaperPlanes = () => {
    paperPlanes.forEach(paperPlane => {
      if(checkCollision(paperPlane.body, balloon.body)){
        balloon.hit();
        balloon.gravityY += .1;
        paperPlane.reset();
      };
      if(checkAlive(paperPlane)){
        paperPlane.reset();
      };
      if(paperPlane.flying){
        paperPlane.shoot();
      }
    });
  };

  const moveWorld = () => {
    landscapes.forEach(landscape => {
      landscape.move(speed, landscape.mover);
      if(checkAlive(landscape)){
        switch (landscapes.indexOf(landscape)) {
          case 0:
            landscape.reset(landscapes[2].body.max.x);
            break;
          case 1:
            landscape.reset(landscapes[0].body.max.x);
            break;
          case 2:
            landscape.reset(landscapes[1].body.max.x);
            break;
          default:
        }
      };
    })
    clouds.forEach(cloud => {
      cloud.move(speed);
      if(checkAlive(cloud)){
        cloud.reset();
      };
    });
  };

  const setupThree = () => {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.z = 600;
    camera.position.y = 780;
    //90 is game
    camera.position.x = 0;

    camera.updateMatrix();
    camera.updateMatrixWorld();

    frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    sceneWidthModifier = frustum.planes[0].constant;

    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    const $gameElement = document.getElementById(`game`);
    if($gameElement){
      $gameElement.appendChild(renderer.domElement);
    }else{
      return;
    }
  };

  const setupWorld = () => {
    setupBalloon();
    setupLandscapes();
    setupClouds();
    setupPaperPlanes();
    render();
    setupStartScreen();
  };

  const setupBalloon = () => {
    balloon = new Balloon(models.balloon.geometry, models.balloon.materials, sceneWidthModifier);
    scene.add(balloon);
  };

  const setupLandscapes = () => {
    const landscape3 = new Landscape(models.landscape3.geometry, models.landscape3.materials, -1450, -230, -1080);
    landscape3.mover = 2150;
    landscapes.push(landscape3);
    scene.add(landscape3);
    const landscape1 = new Landscape(models.landscape1.geometry, models.landscape1.materials, 0, -230, - 1000);
    landscape1.mover = 2100;
    landscapes.push(landscape1);
    scene.add(landscape1);
    const landscape2 = new Landscape(models.landscape2.geometry, models.landscape2.materials, 1400, -230, - 1000)
    landscape2.mover = 2150;
    landscapes.push(landscape2);
    scene.add(landscape2);
  };

  const setupTreelines = () => {
    let treelineX = - 1200;
    for (let i = 0;i < 3;i ++) {
      const treeline = new Treeline(models.treeline.geometry, models.treeline.materials, treelineX, 50, - 600);
      console.log(treeline);
      treelines.push(treeline);
      scene.add(treeline);
      treelineX += 1300;
    }
  };

  const setupClouds = () => {
    let cloudX = 950;
    const cloudGeometrys = [models.cloud.geometry, models.cloud1.geometry, models.cloud2.geometry];
    for (let i = 0;i < 4;i ++) {
      const cloud = new Cloud(cloudGeometrys, models.cloud.materials, cloudX, random(250, 400), random(- 800, - 600), random(.9, 1.1));
      clouds.push(cloud);
      scene.add(cloud);
      cloudX += random(50, 600);
    }
  };

  const setupPaperPlanes = () => {
    //setup 1 plane in pool
    const paperPlane = new PaperPlane(models.paperPlane.geometry, models.paperPlane.materials, sceneWidthModifier);
    paperPlanes.push(paperPlane);
    scene.add(paperPlane);
    //on socket update shoot paperplane
    socket.on(`update`, data => {
      if(data.gestureX === `left`){
        let paperPlaneToShoot = false;
        //check if any not flying planes
        const getAlivePlanes = paperPlanes.filter(pp => !pp.flying);
        //every plane flying? create new and push in array
        if(getAlivePlanes.length === 0){
          const paperPlane = new PaperPlane(models.paperPlane.geometry, models.paperPlane.materials, sceneWidthModifier);
          paperPlanes.push(paperPlane);
          scene.add(paperPlane);
          paperPlaneToShoot = paperPlane;
        //some planes not flying use one from pool
        }else{
          paperPlaneToShoot = getAlivePlanes[0];
        }
        const yPos = mapRange(data.y, 100, 600, 340, -80);
        paperPlaneToShoot.position.y = yPos;
        paperPlaneToShoot.flying = true;
      };
    });
  };

  const setupLights = () => {
    const hemiLight = new THREE.HemisphereLight(0xA1D0BC, 0x269DAE, 1);
    hemiLight.color.setHSL(0.2, .5, 0);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);
    const directionalLight = new THREE.DirectionalLight( 0xFDAC2A, .7 );
    scene.add( directionalLight );
    const light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 2 );
    light.position.set( 600, 1300, -300);
    light.target.position.set( 0, 0, 0 );
    light.castShadow = true;
    light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 3000));
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = window.innerWidth;
    light.shadow.mapSize.height = window.innerHeight;
    scene.add( light );
  };

  const startGame = () => {
    const start = {y: camera.position.y};
    const target = {y: 90};
    const tween = new TWEEN.Tween(start).to(target, 1000);
    tween.easing(TWEEN.Easing.Sinusoidal.InOut);
    tween.start();
    tween.onUpdate(() => {
      camera.position.y = start.y;
    });
    tween.onComplete(() => {
      countDown();
    });
    const balloonStart = balloon.flyToStart();
    balloonStart.onComplete(() => {
      console.log(`balloonstart`);
      balloon.wiggle();
      speed = 3;
      console.log(remoteSocketId);
      socket.emit(`start`, remoteSocketId, {
        message: `Game started!`
      });
    });
  };

  const gameOver = () => {
    console.log(`gedaan mee spelen`);
    speed = 0;
  };

  const countDown = () => {
    const $countDown = document.getElementById(`count-down`);
    let teller = 3;
    $countDown.innerHTML = teller;
      const interval = setInterval(() => {
        teller -= 1;
        $countDown.innerHTML = teller;
        if(teller === 0){
          clearInterval(interval);
          $countDown.classList.add(`invisible`);
        }
      }, 1000);
  };

  const setupStartScreen = () => {
    const $calibrationButton = document.getElementById(`calib`);
    const $playbutton = document.getElementById(`playbutton`);

    $calibrationButton.addEventListener(`click`,e => {
      e.preventDefault();
      calibrate();
    })

    $playbutton.addEventListener(`click`, e => {
      startGame();
    });
  };

  const calibrationTestScreen = () => {
    const $calibrationTest = document.getElementById(`calibration-test`);
    const $calibrationInit = document.getElementById(`calibration-init`);

    if(myPitch > 0){
      $calibrationInit.classList.add(`invisible`);
      $calibrationTest.classList.remove(`invisible`);
    }

    //make balloon work
  };

  const handleStream = stream => {
    // Create an AudioNode from the stream.
    const mediaStreamSource = audioCtx.createMediaStreamSource(stream);
    // Connect it to the destination.
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect(analyser);
    updatePitch();
  };

  const calibrate = () => {
    balloon.hit();
    const calibrationEntries = [];
    const calibrator = setInterval(() => {
      if(pitch !== -1){
        calibrationEntries.push(pitch);
      }
      if(calibrationEntries.length === 49){
        clearInterval(calibrator);
        calibrationEntries.sort((a, b) => {
          return a - b;
        });
        myPitch = calibrationEntries[24];
        calibrationTestScreen();
      }
    }, 50);
  };

  const updatePitch = () => {
    const cycles = new Array;
    analyser.getFloatTimeDomainData(buf);
    const ac = autoCorrelate(buf, audioCtx.sampleRate);
    pitch = ac;
    if (ac > myPitch - 80 && ac < myPitch + 80 && balloon && !pitchUp && speed > 0) {
      console.log(`joe`);
      const tween = balloon.flyUp();
      pitchUp = true;
      tween.onComplete(() => {
        pitchUp = false;
      })
    }
    window.requestAnimationFrame(updatePitch);
  };

  const connectSocket = () => {
    socket = IO.connect(`/`);
    socket.on('sid', ({sid, qrImg}) => {
      socketId = sid;
      const $qrContainer = document.getElementById('qr');
      if($qrContainer){
        $qrContainer.innerHTML = qrImg;
      }else{
        return;
      }
    });

    socket.on(`connected`, ({message, remoteId}) => {
      console.log(`${message} with ${remoteId}`);
      remoteSocketId = remoteId
    });
  };

  const handleAudio = () => {
    audioCtx = new AudioContext();
    navigator.mediaDevices.getUserMedia({audio: true})
    .then(stream => {
      handleStream(stream);
    });
  };

  const checkAlive = object => {
    if (object.position.x < 0 && !frustum.intersectsObject(object)) {
      return true;
    }
  };

  const checkCollision = (bodyA, bodyB) => {
    return bodyA.intersectsBox(bodyB);
  };

  init();
}
