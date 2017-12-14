import IO from 'socket.io-client';
import getUrlParameter from './lib/getUrlParameter';

const controller = () => {

  let socket,
    targetId;

  let touchstartX = 0;
  let touchendX = 0;
  let touchendY = 0;


  const init = () => {

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      console.log(`Mobile device is true!`);
    } else {
      document.getElementById(`no-mobile`).classList.remove(`invisible`);
      //return false;
    }

    targetId = getUrlParameter(`id`);
    if (!targetId) {
      return;
    }

    socket = IO.connect(`/`);

    socket.on(`sid`, ({sid}) => {
      console.log(sid);
      socket.emit(`update`, targetId, {
        message: `connection succesfull`,
        remoteId: sid
      });
    });

    socket.on(`update`, ({message}) => {
      console.log(message);
    });

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

  init();

};

export default controller;
