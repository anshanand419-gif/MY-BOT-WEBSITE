const mineflayer = require('mineflayer');

// Change these to your target server details
const SERVER_HOST = 'YOUR_SERVER_IP'; // e.g., yourserver.aternos.me
const SERVER_PORT = 25565;            // Your server port
const BOT_USERNAME = 'HELL_KING_ANSH';

let reconnectTimer = null;
let stopped = false;

function startBot() {
  if (stopped) return;

  console.log('Connecting to ' + SERVER_HOST + ':' + SERVER_PORT);

  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: false // UNIVERSAL AUTO-DETECT: Automatically matches any server version
  });

  const hostileMobs = [
    'zombie', 'skeleton', 'creeper', 'spider', 'cave_spider',
    'drowned', 'husk', 'stray', 'witch', 'phantom',
    'enderman', 'zombified_piglin', 'piglin', 'blaze',
    'wither_skeleton', 'slime'
  ];

  let attacking = false;
  let targetMob = null;

  bot.once('spawn', function () {
    console.log('BOT CONNECTED SUCCESSFULLY');

    // ANTI-AFK SYSTEM (Prevents idle kicks)
    setInterval(() => {
      if (!bot.entity) return;

      bot.setControlState('jump', true);
      bot.setControlState('forward', true);

      setTimeout(() => {
        if (!bot.entity) return;
        bot.setControlState('jump', false);
      }, 800);
    }, 15000);

    startRandomActions(bot);

    // 10 hours limit timer
    setTimeout(function () {
      if (bot.entity) {
        stopped = true;
        bot.quit('10 hour limit reached');
      }
    }, 10 * 60 * 60 * 1000);
  });

  bot.on('message', function (message) {
    const msg = message.toString();
    console.log('[CHAT]', msg);
  });

  bot.on('physicsTick', function () {
    if (!bot.entity) return;

    targetMob = bot.nearestEntity(function (entity) {
      return (
        entity.type === 'mob' &&
        hostileMobs.includes(entity.name) &&
        entity.health > 0 &&
        bot.entity.position.distanceTo(entity.position) <= 3.5
      );
    });

    if (targetMob && !attacking) {
      attacking = true;

      bot.lookAt(
        targetMob.position.offset(0, targetMob.height || 1, 0), true
      );

      bot.attack(targetMob);

      setTimeout(function () {
        attacking = false;
      }, 600);
    }
  });

  bot.on('physicsTick', function () {
    if (!bot.entity) return;

    if (bot.isInWater) {
      bot.setControlState('jump', true);
    }
  });

  function startRandomActions(botInstance) {
    function nextAction() {
      var delay = Math.floor(Math.random() * 1000) + 7000;

      setTimeout(function () {
        if (!botInstance.entity) return;

        if (targetMob) {
          nextAction();
          return;
        }

        botInstance.setControlState('forward', false);

        if (Math.random() < 0.5) {
          botInstance.setControlState('sneak', true);
          randomLook(botInstance);

          setTimeout(function () {
            if (!botInstance.entity) return;

            botInstance.setControlState('sneak', false);
            botInstance.setControlState('forward', true);
            nextAction();
          }, 1500);
        } else {
          randomLook(botInstance);

          setTimeout(function () {
            if (!botInstance.entity) return;

            randomLook(botInstance);
            botInstance.setControlState('forward', true);
            nextAction();
          }, 1200);
        }
      }, delay);
    }

    nextAction();
  }

  function randomLook(botInstance) {
    var yaw = (Math.random() - 0.5) * Math.PI * 2;
    var pitch = (Math.random() - 0.5) * (Math.PI / 4);

    botInstance.look(yaw, pitch, false);
  }

  bot.on('error', function (err) {
    console.log('BOT ERROR: ' + (err.code || err.message));
  });

  bot.on('kicked', function (reason) {
    console.log('BOT KICKED: ' + reason);
  });

  bot.on('end', function (reason) {
    console.log('BOT DISCONNECTED: ' + reason);
    if (stopped) return;

    if (!reconnectTimer) {
      console.log('Reconnecting in 15 seconds...');

      reconnectTimer = setTimeout(function () {
        reconnectTimer = null;
        startBot();
      }, 15000);
    }
  });
}

startBot();
