const resetDom = () => {
  console.log(document.getElementById(`body`));
  document.getElementById(`body`).innerHTML = ``;
  document.getElementById(`body`).innerHTML = `  <div id="about" class="about invisible">
      <div class="about-box">
        <img src="./assets/svg/about-us-title.svg" alt="about us">
        <div id="close-button" class="close-button"></div>
      </div>
      <div class="about-description">
          <p>
            we are devine students ( <cite>arne</cite> mangelschots and <cite>nicolas</cite> vanlerberghe) who were assigned to make an experimental web application.
          </p>
        <br>
          <p>
            <p>The techniques we use :</p>
              <ul>
                <li><cite>WebGl - Three JS</cite></li>
                <li><cite>Web Audio API</cite></li>
                <li><cite>CWilso Pitch Detect</cite></li>
              </ul>
          </p>
            <br>
          <p> We used three.js to make our <cite>landscape environment</cite> and other models, websockets to <cite>connect your phone</cite> to shoot paper airplane
            and web audio to <cite>calibrate your whistle</cite> and move the balloon!
          </p>

        <div class="devine-logo">
          <img src="./assets/svg/devine-logo.svg" alt="devine logo">
        </div>
      </div>
    </div>
    <div id="startscreen" class="startscreen">
      <div class="title-box">
        <header class="big-title">
          <div class="poly-box">
            <img class="poly-word" src="./assets/svg/poly.svg" alt="poly text">
          </div>
          <img src="./assets/svg/balloontext-title.svg" alt="balloon text">
        </header>
        <div class="press-key">
            <img src="./assets/svg/press.svg" alt="press any key to start the game">
        </div>
      </div>

    </div>

    <div id="intro-polyballoon" class="intro-polyballoon invisible">
      <div class="how-title-box">
        <div class="invisible-box"></div>
        <header>
          <img src="./assets/svg/how-title.svg" alt="how to play title" width="400px"/>
        </header>
        <button id="question" class="question-button" type="button" name="info-button"></button>
      </div>

      <div class="players-section">
        <div class="player-one">
          <img src="./assets/svg/player-one.svg" class="player-title" alt="player-one">
          <img class="player-image" src="./assets/svg/music-notes.svg" alt="music notes">
          <div class="text-box">
            <p>You are the balloon traveler who is going on world journey!
              To keep your balloon going you have to whistle!</p>
          </div>
          <div class="todo-box" id="calibration-init">

            <div class="todo-text">
              <p>To calibrate your whistle-tone you have to press the button underneath
                and try to whistle a steady tone for 5 seconds!</p>
            </div>
            <div class="calibration-box">
              <h1 class="green-info" id="succes">calibration successful</h1>
              <button class="calibration-button" id="calib" type="button" name="calibration-button"></button>
              <div class="loading-bar"></div>
              <div class="loading-fill">
                <svg width="300" height="20" viewbox="0 0 300 20" xmlns="http://www.w3.org/2000/svg">
                  <rect id="loading-filler" width="10px" height="20" style="fill: white;"/>
                </svg>
              </div>
            </div>

          </div>
          <div class="todo-box invisible" id="calibration-test">

            <!-- /////////// TEST BALLOON FASE /////////// -->
            <div class="todo-text">
              <p>Try to make the balloon jump up by blowing short whistles</p>
            </div>
            <div class="test-balloon-box">
              <div class="test-balloon">
                <img src="./assets/svg/balloon.svg" class="mini-balloon" id="mini-balloon" alt="test balloon" align="bottom">
              </div>
              <h1 class="grey-info">not working properly?</h1>
              <button class="recalibration-button" id="recal-button" type="button" name="recalibration-button"></button>
              <button class="ready-button" type="button" name="button" id="ready-p1"></button>
            </div>

          </div>

        </div>
        <div class="play">
          <img src="./assets/svg/vs.svg" alt="versus">
          <button class="play-button invisible" id="playbutton" type="button" name="play-button"></button>
          <div class="waiting" id="waiting">
            <p>Waiting for <br /><img src="./assets/svg/player-one.svg" class="p1" id="p1" alt="player-one"><br />
              <span id="and">and</span><br />
              <span class="p2">
                <img src="./assets/svg/player-two.svg" id="p2"  class="p2" alt="player-two">
              </span>
              <br />to get ready!</p>
          </div>
        </div>
        <div class="player-two">
          <img src="./assets/svg/player-two.svg"  class="player-title" alt="player-two">
          <img class="player-image paperplane" src="./assets/svg/paper-plane.svg" alt="paperplane">
          <div class="text-box">
            <p>you are the paper plane-throwing tourist in the mountain! Throw paper planes at the balloon with your phone!</p>
          </div>
          <div class="todo-box">
            <div class="todo-text">
              <p>Scan this barcode to connect with your smarthpone and get some paper plane throwing-action going!</p>
            </div>
            <div class="qr-code-box">
              <h1 class="purple-info" id="connected-info">connection successful</h1>
              <div id="qr" class="qr"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="interface" class="interface invisible">
      <div class="game-frame">
        <div class="interface-box">

          <div class="damage-box">
            <img src="./assets/svg/dmg-meter.svg" class="dmg-meter" alt="">
            <div class="dmg-fill">
              <svg width="300" height="20" viewbox="0 0 300 20" xmlns="http://www.w3.org/2000/svg">
                <rect id="damage-filler" width="0px" height="20" style="fill: #EC4056;"/>
              </svg>
            </div>
            <img src="./assets/svg/dmg-loader.svg" class="dmg-loader" alt="">
            <h1>dmg</h1>
          </div>

          <div class="distance-box">
            <h1 id="score">100</h1><h1>km</h1>
          </div>

          <div class="pause-box" id="pause">
            <!-- <img src="./assets/svg/pause-button.svg" alt="pause button" width="40px"> -->
            <div class="pause-button"></div>
          </div>
        </div>
      </div>
      <div class="frame-pieces">
        <div class="frame-left"></div>
        <div class="frame-right"></div>
      </div>
    </div>

    <div id="game-over" class="game-over invisible">
      <div class="game-over-box lightGrayPixelBg">
        <div class="score-box darkGrayPixelBg">
          <div class="total-score">
            <h1>total score</h1>
            <div class="score">
              <strong>*</strong><h2 id="endscore"></h2><strong>*</strong>
            </div>

          </div>
          <div class="score-description">
            <p>YOU MADE IT TO THE Schnebelhorn MOUNTAINS, NOT BAD FOR A second grade balloonist </p>
          </div>
        </div>

        <div class="buttons-box">
          <button id="back-button" class="back-button" type="button" name="back-to-menu"></button>
          <button id="try-button" class="try-button" type="button" name="try-again"></button>
        </div>
      </div>
    </div>

    <div id="game">
    </div>
    <div id="count-down" class="count-down">
    </div>`;
};

export default resetDom;
