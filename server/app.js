const inert = require(`inert`);
const Hapi = require(`hapi`);
const fs = require(`fs`);
const Path = require(`path`);
const shortid = require(`shortid`);
const qrcode = require(`qrcode-generator`);

let tls = false;

{

  const init = () => {
    if (process.env.NODE_ENV === `development`) {
      tls = {
        key: fs.readFileSync(`./config/sslcerts/key.pem`),
        cert: fs.readFileSync(`./config/sslcerts/cert.pem`)
      };
    }

    const server = new Hapi.Server();

    server.connection({
      port: process.env.PORT || 3000,
      tls,
      host: `0.0.0.0`,
      routes: {
        files: {
          relativeTo: Path.join(__dirname, `public`)
        }
      }
    });

    server.register(inert);

    server.route({
      method: `GET`,
      path: `/{param*}`,
      handler: {
        directory: {
          path: `.`,
          redirectToSlash: true,
          index: true
        }
      }
    });

    server.start(err => {
      if (err) {
        throw err;
      }
      console.log(`Server running at: ${server.info.uri}`);
    });

    const io = require(`socket.io`)(server.listener);

    const users = {};

    io.on(`connection`, socket => {
      const sid = shortid.generate();
      const qr = qrcode(4, `L`);
      qr.addData(`http://192.168.0.247:3000/controller.html?id=${sid}&page=controller`);
      qr.make();
      const qrImg = qr.createImgTag();

      socket.emit(`sid`, {sid, qrImg});

      users[sid] = {
        id: socket.id
      };

      socket.on(`update`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`update`, data);
      });

      socket.on(`connected`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`connected`, data);
      });

      socket.on(`start`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`start`, data);
      });

      socket.on(`shoot`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`shoot`, data);
      });

      socket.on(`planeback`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`planeback`, data);
      });

      socket.on(`pause`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`pause`, data);
      });

      socket.on(`restart`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`restart`, data);
      });

      socket.on(`gameover`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`gameover`, data);
      });

      socket.on(`softrestart`, (targetId, data) => {
        if (!users[targetId]) {
          return;
        }
        socket.to(users[targetId].id).emit(`softrestart`, data);
      });


      socket.on(`disconnect`, () => {
        delete users[sid];
      });
    });

  };

  init();

}
