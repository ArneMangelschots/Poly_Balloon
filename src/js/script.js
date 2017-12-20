import mapRange from './lib/mapRange';
import autoCorrelate from './lib/autoCorrelate';
import random from './lib/random';
import getUrlParameter from './lib/getUrlParameter';
import resetDom from './lib/resetDom';

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

  const toLoad = [`landscape1`,`landscape2`, `landscape3`, `balloon`, `balloon1`, `balloon2`, `balloon3`, `balloon4`, `cloud`, `cloud1`, `cloud2`, `treeline`, `paperPlane`];

  let renderAnimationFrame;

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

  let p1ready = false,
    p2ready = false;

  let speed = 0,
    audioCtx,
    analyser,
    pitch = false,
    myPitch = 20000,
    pitchUp = false,
    lastShotPlane = false,
    score = 0,
    counter = 0,
    damage = 0;

  let socket,
      socketId,
      remoteSocketId;

  const buflen = 1024,
    buf = new Float32Array(buflen);

  //SETUP EVERYTHING

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

  //SETUPGAME

  const game = () => {
    setupThree();
    setupLights();
    setupWorld();
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

  const setupWorld = () => {
    setupBalloon();
    setupLandscapes();
    setupClouds();
    setupPaperPlanes();
    render();
    setupStartScreen();
  };

  const setupBalloon = () => {
    const balloonGeometrys = [models.balloon.geometry, models.balloon1.geometry, models.balloon2.geometry, models.balloon3.geometry, models.balloon4.geometry];
    balloon = new Balloon(balloonGeometrys, models.balloon.materials, sceneWidthModifier);
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
    let cloudX2 = 950;
    for (let i = 0;i < 4;i ++) {
      const cloud = new Cloud(cloudGeometrys, models.cloud.materials, cloudX2, random(600, 1100), random(- 800, - 600), random(.9, 1.1));
      clouds.push(cloud);
      scene.add(cloud);
      cloudX2 += random(50, 600);
    }
  };

  const setupPaperPlanes = () => {
    //setup 1 plane in pool
    const paperPlane = new PaperPlane(models.paperPlane.geometry, models.paperPlane.materials, sceneWidthModifier);
    paperPlanes.push(paperPlane);
    scene.add(paperPlane);
    //on socket update shoot paperplane
    socket.on(`shoot`, data => {
      console.log(data);
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
      const yPos = mapRange(data.yPos, data.min, data.max, 340, -80);
      paperPlaneToShoot.position.y = yPos;
      paperPlaneToShoot.flying = true;
      lastShotPlane = paperPlaneToShoot;
    });
  };

  //END WORLD SETUP

  //START SETUP AND HANDLE DOM

  const setupStartScreen = () => {
    window.addEventListener(`keydown`, setupIntro);
  };

  const setupIntro = () => {
    window.removeEventListener(`keydown`, setupIntro, false);
    document.getElementById(`intro-polyballoon`).classList.remove(`invisible`);
    document.getElementById(`startscreen`).classList.add(`invisible`);

    const $about = document.getElementById(`question`);
    const $calibrationButton = document.getElementById(`calib`);
    const $playbutton = document.getElementById(`playbutton`);

    $about.addEventListener(`click`,aboutUs);

    $calibrationButton.addEventListener(`click`,e => {
      e.preventDefault();
      e.currentTarget.setAttribute(`disabled`, true);
      calibrate();
    })

    $playbutton.addEventListener(`click`, superStartGame);
  };

  const aboutUs = () => {
    document.getElementById(`about`).classList.remove(`invisible`);

  }

  const calibrationTestScreen = () => {
    const $calibrationTest = document.getElementById(`calibration-test`);
    const $calibrationInit = document.getElementById(`calibration-init`);
    const $recalibrate = document.getElementById(`recal-button`);
    const $readyToGo = document.getElementById(`ready-p1`);
    if(myPitch > 0){
      $calibrationInit.classList.add(`invisible`);
      $calibrationTest.classList.remove(`invisible`);
    }

    $recalibrate.addEventListener(`click`, e => {
      e.preventDefault();
      resetCalibration();
    });

    balloonTest();

    $readyToGo.addEventListener(`click`, e => {
      e.preventDefault();
      p1ready = true;
      handlePlayer1Ready();
    });

  };

  const handlePlayer1Ready = () => {
    const $and = document.getElementById(`and`);
    const $p1 = document.getElementById(`p1`);
    const $recalibrate = document.getElementById(`recal-button`);
    const $play = document.getElementById(`playbutton`);
    const $waitingDiv = document.getElementById(`waiting`);

    if(!$and.classList.contains(`invisible`)){
      $and.classList.add(`invisible`);
    }

    $p1.classList.add(`invisible`);
    $recalibrate.classList.add(`invisible`);

    if(p2ready){
      $waitingDiv.classList.add(`invisible`);
      $play.classList.remove(`invisible`);
    }
  };

  const handlePlayer2Ready = () => {
    const $and = document.getElementById(`and`);
    const $p2 = document.getElementById(`p2`);
    const $qr = document.getElementById(`qr`);
    const $play = document.getElementById(`playbutton`);
    const $waitingDiv = document.getElementById(`waiting`);

    if(!$and.classList.contains(`invisible`)){
      $and.classList.add(`invisible`);
    }
    $p2.classList.add(`invisible`);
    $qr.classList.add(`invisible`);

    if(p1ready){
      $waitingDiv.classList.add(`invisible`);
      $play.classList.remove(`invisible`);
    }
  };

  const balloonTest = () => {
    const $miniBalloon = document.getElementById(`mini-balloon`);
    if (pitch > myPitch - 80 && pitch < myPitch + 80 && !pitchUp) {
      const top = {top: 85};
      const target = {top: 0};
      const tween = new TWEEN.Tween(top).to(target, 400);
      tween.easing(TWEEN.Easing.Cubic.InOut);
      tween.repeat(1);
      tween.yoyo(true);
      tween.start();
      tween.onUpdate(() => {
        $miniBalloon.style.marginTop = `${top.top}px`
      });
      pitchUp = true;
      tween.onComplete(() => {
        pitchUp = false;
      })
    }
    window.requestAnimationFrame(balloonTest);
  };

  const resetCalibration = () => {
    myPitch = 20000;

    const $loadingFiller = document.getElementById(`loading-filler`);
    $loadingFiller.setAttribute(`width`, `10px`)

    const $calibrationTest = document.getElementById(`calibration-test`);
    const $calibrationInit = document.getElementById(`calibration-init`);

    $calibrationTest.classList.add(`invisible`);
    $calibrationInit.classList.remove(`invisible`);

    document.getElementById(`calib`).removeAttribute(`disabled`);
    document.getElementById(`succes`).classList.remove(`fade-in`);
  };

  const calibrate = () => {
    const $loadingFiller = document.getElementById(`loading-filler`);
    const $succes = document.getElementById(`succes`);
    const calibrationEntries = [];
    const calibrator = setInterval(() => {
      if(pitch !== -1){
        calibrationEntries.push(pitch);
        const width = parseInt($loadingFiller.getAttribute(`width`));
        $loadingFiller.setAttribute(`width`, `${width+4.5}px`)
      }
      if(calibrationEntries.length === 49){
        clearInterval(calibrator);
        calibrationEntries.sort((a, b) => {
          return a - b;
        });
        myPitch = calibrationEntries[24];
        $succes.classList.add(`fade-in`);
        setTimeout(() => {
          calibrationTestScreen();
        }, 2000)
      }
    }, 50);
  };

  //END SETUP AND HANDLE DOM

  //START GAMELOGIC

  const render = () => {
    console.log(speed);
    TWEEN.update();
    renderer.render(scene, camera);
    if(speed > 0){
      checkBalloonDeath();
    }
    moveWorld();
    checkPaperPlanes();
    displayScore();
    renderAnimationFrame = window.requestAnimationFrame(render);
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
        paperPlane.reset();
        socket.emit(`planeback`, remoteSocketId, {
          planeBack: true
        });
        handleDamage();
      };
      if(checkAlive(paperPlane)){
        paperPlane.reset();
        socket.emit(`planeback`, remoteSocketId, {
          planeBack: true
        });
      };
      if(paperPlane.flying){
        paperPlane.shoot();
      }
    });
  };

  const displayScore = () => {
    document.getElementById(`score`).innerHTML = score;
  };

  const handleDamage = () => {
    const $dmgFiller = document.getElementById(`damage-filler`);
    damage += 50;
    $dmgFiller.setAttribute(`width`, `${damage}px`)
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

  const toggleScoreCounting = () => {
    console.log(`piemel`);
    if(speed > 0){
    counter = setInterval(() => {
        score += 1;
      }, 1000);
    }else if(speed === 0 && counter){
      clearInterval(counter);
    }
  };

  const superStartGame = e => {
    console.log(`superStartGame`);
    e.preventDefault();
    e.currentTarget.removeEventListener(`click`, superStartGame, false);
    document.getElementById(`intro-polyballoon`).classList.add(`invisible`);
    document.getElementById(`interface`).classList.remove(`invisible`);
    const start = {y: camera.position.y};
    const target = {y: 90};
    const tween = new TWEEN.Tween(start).to(target, 1000);
    tween.easing(TWEEN.Easing.Sinusoidal.InOut);
    tween.start();
    tween.onUpdate(() => {
      camera.position.y = start.y;
    });
    tween.onComplete(() => {
      const projScreenMatrix = new THREE.Matrix4();
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      softStartGame();
    });
  };

  const softStartGame = () => {
    countDown();
    const balloonStart = balloon.flyToStart();
    balloonStart.onComplete(() => {
      balloon.wiggle();
      speed = 3;
      document.getElementById(`pause`).addEventListener(`click`, pauseGame);
      toggleScoreCounting();
      socket.emit(`start`, remoteSocketId, {
        message: `Game started!`
      });
    });
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

  const softRestart = e => {
    e.preventDefault();
    e.currentTarget.removeEventListener(`click`, softRestart, false);
    softReset();
    softStartGame();
  };

  const softReset = () => {
    console.log(`yeah`);
    document.getElementById(`game-over`).classList.add(`invisible`);
    score = 0;
    damage = 0;
    counter = 0;
    balloon.reset();
  };

  const hardRestart = e => {
    e.preventDefault();
    e.currentTarget.removeEventListener(`click`, hardRestart, false);
    window.cancelAnimationFrame(renderAnimationFrame);
    resetDom();
    resetVars();
    connectSocket();
    game();
  };

  const gameOver = () => {
    document.getElementById(`game-over`).classList.remove(`invisible`);
    document.getElementById(`endscore`).innerHTML = `${score} KM`;

    speed = 0;
    toggleScoreCounting();

    const $backbutton = document.getElementById(`back-button`);
    const $trybutton = document.getElementById(`try-button`);

    $trybutton.addEventListener(`click`, softRestart);
    $backbutton.addEventListener(`click`, hardRestart);
  };

  const pauseGame = e => {
    e.currentTarget.removeEventListener(`click`, pauseGame, false);
    e.currentTarget.addEventListener(`click`, playGame);
    speed = 0;
    toggleScoreCounting();
  };

  const playGame = e => {
    e.currentTarget.removeEventListener(`click`, playGame, false);
    e.currentTarget.addEventListener(`click`, pauseGame);
    speed = 3;
    toggleScoreCounting();
  };

  const checkAlive = object => {
    if (object.position.x < 0 && !frustum.intersectsObject(object)) {
      return true;
    }
  };

  const checkCollision = (bodyA, bodyB) => {
    return bodyA.intersectsBox(bodyB);
  };


  //END GAME GAMELOGIC

  //PITCH AND SOCKET
  const updatePitch = () => {
    const cycles = new Array;
    analyser.getFloatTimeDomainData(buf);
    const ac = autoCorrelate(buf, audioCtx.sampleRate);
    pitch = ac;
    if (pitch > myPitch - 80 && pitch < myPitch + 80 && balloon && !pitchUp && speed > 0) {
      const tween = balloon.flyUp();
      pitchUp = true;
      tween.onComplete(() => {
        pitchUp = false;
      })
    }
    window.requestAnimationFrame(updatePitch);
  };

  const connectSocket = () => {
    socket = IO.connect(`/`, {transports: ['websocket']});
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
      console.log(message);
      document.getElementById(`connected-info`).classList.add(`fade-in`);
      p2ready = true;
      handlePlayer2Ready();
      remoteSocketId = remoteId;
    });
  };

  const handleAudio = () => {
    audioCtx = new AudioContext();
    navigator.mediaDevices.getUserMedia({audio: true})
    .then(stream => {
      handleStream(stream);
    });
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

  //resetVars

  const resetVars = () => {
    console.log(`joe`);
      scene = false;
      camera = false;
      renderer = false;
      frustum = false;
      sceneWidthModifier = false;

      landscapes = [];
      clouds = [];
      balloon = false;
      paperPlanes = [];

      p1ready = false;
      p2ready = false;

      myPitch = 20000;

      speed = 0;

      pitchUp = false;
      pitch = 0;
      lastShotPlane = false;
      score = 0;
      counter = 0;
      damage = 0;

      socket = false;
      socketId = 0;
      remoteSocketId = 0;
  };

  init();
}
