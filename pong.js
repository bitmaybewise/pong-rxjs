STATUSES = { STOPED: 'STOPED', RUNNING: 'RUNNING', GAMEOVER: 'GAMEOVER' };

var pong = {
  status: STATUSES.STOPED,
  pressedKeys: [],
  score: 0,
  ball: {
    speed: 5,
    x: 135,
    y: 100,
    directionX: -1,
    directionY: -1
  }
};

var KEYS = { LEFT: 37, RIGHT: 39 };

function moveRacket(racketHTML, pong) {
  var left = racketHTML.offsetLeft;
  if (pong.pressedKeys[KEYS.LEFT]) {
    return left - 5;
  }
  else if (pong.pressedKeys[KEYS.RIGHT]) {
    return left + 5;
  }
  else { return left };
}

function drawRacket(racketHTML, pixelPos) {
  racketHTML.style.left = pixelPos + 'px';
}

function nextPosition(currentPosition, speed, direction) {
  return currentPosition + speed * direction;
}

function moveBallDirectionX(playgroundHTML, ball) {
  var width = playgroundHTML.offsetWidth, directionX = ball.directionX;
  var positionX = nextPosition(ball.x, ball.speed, ball.directionX);
  if(positionX > width) { directionX = -1; }
  if(positionX < 0) { directionX = 1; }
  return directionX;
}

function moveBallDirectionY(playgroundHTML, ball) {
  var height = playgroundHTML.offsetHeight, directionY = ball.directionY;
  var positionY = nextPosition(ball.y, ball.speed, ball.directionY);
  if(positionY > height) { directionY = -1; }
  if(positionY < 0) { directionY = 1; }
  return directionY;
}

function moveBallPosition(ball, direction) {
  return ball.speed * direction;
}

function changeBallPosition(ball, dirX, posX, dirY, posY) {
  ball.directionX = dirX;
  ball.directionY = dirY;
  ball.x += posX;
  ball.y += posY;
}

function drawBall(ballHTML, ball) {
  ballHTML.style.left = ball.x + 'px';
  ballHTML.style.top  = ball.y + 'px';
}

function racketPositionY(racketHTML, ballHTML) {
  var ballSize = ballHTML.offsetHeight;
  return racketHTML.offsetTop - ballSize / 2; // subtracting size of ball for doesn't pass through racket
}

function isRacketHit(racketHTML, ballHTML, ball) {
  var racketBorderLeft  = racketHTML.offsetLeft;
  var racketBorderRight = racketBorderLeft + racketHTML.offsetWidth;
  var posX              = nextPosition(ball.x, ball.speed, ball.directionX);
  var posY              = nextPosition(ball.y, ball.speed, ball.directionY);
  var racketPosY        = racketPositionY(racketHTML, ballHTML);
  return (posX >= racketBorderLeft && 
          posX <= racketBorderRight && 
          posY >= racketPosY);
}

function changeScore(pong) {
  pong.score++;
}

function drawScore(scoreHTML, score) {
  scoreHTML.innerHTML = score;
}

function changeDirectionY(ball) {
  ball.directionY = -1;
}

function isGameOver(racketHTML, ballHTML, ball) {
  var bottomPos  = racketHTML.offsetHeight;
  var posY       = nextPosition(ball.y, ball.speed, ball.directionY) - bottomPos;
  var racketPosY = racketPositionY(racketHTML, ballHTML);
  return posY > racketPosY;
}

function endGame(pong) {
  pong.status = STATUSES.GAMEOVER;
}

function drawEndGame(gameOverHTML) {
  gameOverHTML.style.display = 'block';
}

function isRunning() {
  return pong.status === STATUSES.RUNNING;
}

function isStoped() {
  return pong.status === STATUSES.STOPED;
}

function buildPosition(dirX, dirY, x, y) {
  return { directionX: dirX, directionY: dirY, x: x, y: y };
}

function load() {
  var playgroundHTML = document.getElementById('playground'),
      racketHTML     = document.getElementById('racket'),
      ballHTML       = document.getElementById('ball'),
      scoreHTML      = document.getElementById('score'),
      startHTML      = document.getElementById('start-message'),
      gameOverHTML   = document.getElementById('game-over'),
      keyDown        = Rx.Observable.fromEvent(document, 'keydown'),
      keyUp          = Rx.Observable.fromEvent(document, 'keyup'),
      interval       = Rx.Observable.interval(16),
      loop           = interval.filter(isRunning),
      stoped         = keyDown.filter(isStoped),
      newDirX        = loop.map(function() { return moveBallDirectionX(playgroundHTML, pong.ball); }),
      newDirY        = loop.map(function() { return moveBallDirectionY(playgroundHTML, pong.ball); }),
      newPosX        = newDirX.map(function(dirX) { return moveBallPosition(pong.ball, dirX); }),
      newPosY        = newDirY.map(function(dirY) { return moveBallPosition(pong.ball, dirY); }),
      newBallPos     = Rx.Observable.zip(newDirX, newDirY, newPosX, newPosY, buildPosition),
      moveRacketPos  = loop.map(function() { return moveRacket(racketHTML, pong); }),
      hit            = loop.filter(function() { return isRacketHit(racketHTML, ballHTML, pong.ball); }),
      gameOver       = loop.filter(function() { return isGameOver(racketHTML, ballHTML, pong.ball); });

  keyDown.subscribe(function markAsPressed(event) { pong.pressedKeys[event.which] = true;  });
  keyUp.subscribe(function markAsNotPressed(event) { pong.pressedKeys[event.which] = false; });
  stoped.subscribe(function startGame(event) {
    pong.status = STATUSES.RUNNING;
    startHTML.style.display = 'none';
  });
  newBallPos.subscribe(function(pos) { 
    changeBallPosition(pong.ball, pos.directionX, pos.x, pos.directionY, pos.y);
    drawBall(ballHTML, pong.ball);
  });
  moveRacketPos.subscribe(function(pixelPos) { drawRacket(racketHTML, pixelPos); });
  hit.subscribe(function(hit) { 
    changeDirectionY(pong.ball); 
    changeScore(pong);
    drawScore(scoreHTML, pong.score);
  });
  gameOver.subscribe(function() {
    endGame(pong);
    drawEndGame(gameOverHTML);
  });
}

window.onload = load;
