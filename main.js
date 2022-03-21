//music
var correctMusic = new Howl({
    src:['sounds/pinwheel.mp3'],
    volume: 0.3,
});

var endMusic = new Howl({
    src:['sounds/piston-1.mp3'],
    volume: 0.5,
});

// We use the borders bounds to position elements inside, so define it early. 
var border = new Shape.Rectangle(new Point(Math.floor(20), Math.floor(20)), new Size(view.size.width-40,view.size.height-40));
border.strokeColor = 'white';
border.strokeWidth = '3';

function isMobile() {
    var toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    
    return toMatch.some(function (toMatchItem) {
        return navigator.userAgent.match(toMatchItem);
    });
}

// Draw the arrow keys
var canvas = document.getElementById('myCanvas');
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var isSmallScreen = canvas.width < 600;

// Make the arrow keys bigger on mobile
var mobileKeySize = 125;
var keySize = 50;
var extraKeyOffset = 150;
var upPress, downPress, leftPress, rightPress;

if (isMobile()) {    
    upPress = new Path.RegularPolygon(new Point(paper.view.center.x, border.size.height-550), 3, mobileKeySize);
    downPress = new Path.RegularPolygon(new Point(paper.view.center.x, border.size.height-100), 3, mobileKeySize);
    leftPress= new Path.RegularPolygon(new Point(paper.view.center.x - 260, border.size.height-325), 3, mobileKeySize);
    rightPress= new Path.RegularPolygon(new Point(paper.view.center.x + 260, border.size.height-325), 3, mobileKeySize);
} else {
    upPress = new Path.RegularPolygon(new Point(paper.view.center.x, border.size.height-350), 3, keySize);
    downPress = new Path.RegularPolygon(new Point(paper.view.center.x, border.size.height-100), 3, keySize);
    leftPress= new Path.RegularPolygon(new Point(paper.view.center.x - 200  , border.size.height-225), 3, keySize);
    rightPress= new Path.RegularPolygon(new Point(paper.view.center.x + 200, border.size.height-225), 3, keySize);
}

var centerX = border.size.width/2;
var centerY = border.size.height/2;

upPress.strokeWidth = 5;
upPress.opacity = 1;
upPress.fillColor = 'red';
upPress.onMouseDown = function(event) {
    handleKeyDown('up');
}

downPress.strokeWidth = 5;
downPress.opacity = 1;
downPress.rotate(180);
downPress.fillColor = 'blue';
downPress.onMouseDown = function(event) {
    handleKeyDown('down');
}

leftPress.strokeWidth = 5;
leftPress.opacity = 1; 
leftPress.rotate(270);
leftPress.fillColor = 'green'
leftPress.onMouseDown = function(event) {
    handleKeyDown('left');
}

rightPress.strokeWidth = 5;
rightPress.opacity = 1;
rightPress.rotate(90);
rightPress.fillColor = 'yellow';
rightPress.onMouseDown = function(event) {
    handleKeyDown('right');
}

var localStorage = window.localStorage;
var persistedHighScoreAllTime = localStorage.getItem('highScore');
var highScore = 0;

if (persistedHighScoreAllTime) {
    highScore = persistedHighScoreAllTime;
}

var progressBar = new Shape.Rectangle(new Point(50, 50), new Point(paper.view.size.width - 50, 100));
progressBar.fillColor = 'white';

// Configuration/variables 
var scoreCanHaveOr = 30;
var scoreCanHaveNothing = 20;
var scoreCanHaveMultipleNots = 10;
var scoreCanHaveColors = 6;

var initialTimeAmount = 500;
var answerFontSize = 70;
var smallAnswerFontSize = 75/1.3;
var lastAnswer = "";

// Global variables for game state, objects, etc.
var score = 0;
var currentTimeAmount = initialTimeAmount;
var gameOver = false;
var timer = initialTimeAmount;
var answerTextEl;
var gameOverTextEl;

var correctAnswers = [];
var colors = ['red', 'green', 'blue', 'yellow'];
var directions = ['up', 'down', 'left', 'right'];
var arrowKeys = [upPress, downPress, leftPress, rightPress];

// Text that depends on game variables

var scoreText = new PointText({
    point: [border.bounds.bottomLeft.x + 50, border.bounds.bottomLeft.y - 50],
	fillColor:'white',
	content: 'Score: ' + score.toString(),
	fontSize: 25,
    fontFamily: 'Roboto mono',
});

var highScoreString = 'Highscore: ' + highScore.toString();
var highScoreText = new PointText({
	point: [border.bounds.bottomRight.x - 18 * highScoreString.length, border.bounds.bottomRight.y - 50],
	fillColor: 'white',
	content: 'Highscore: ' + highScore.toString(),
	fontSize: 25,
    fontFamily: 'Roboto mono',
});

// Start game by generating words.
generateWords();

function onFrame(event){
    if (gameOver) {
        return;
    }
    var standardDelta = 1/200;
    // Time in seconds since last frame render
    var delta = event.delta;
    var timeMultipler = delta/standardDelta;
    // We want the initial timer to be around ~2s, so based on time between the last frame render,
    // that's how we approximate the timer going down. 
    timer -= timeMultipler;
    if (progressBar) {
        progressBar.remove();
    }
    // TODO(ling): don't always re-initialise this... surely there must be a way to set the right bound
    
    var initialStartRightBound = paper.view.size.width - 50;
    // TODO(ling): document this horrendous math...
    progressBar = new Shape.Rectangle(new Point(50, 50), new Point(initialStartRightBound - (initialStartRightBound - 50)*(1 - timer/currentTimeAmount), 100));
    progressBar.fillColor = "white";
    if (timer <= 0) {
        if (correctAnswers.length === 0) {
            onCorrectAnswer();
        } else {
            onIncorrectAnswer();
        }
    }
}

function onResize(event) {
    // TODO(ling): fill this in for responsiveness.
}

function resetTimer() {
    timer = currentTimeAmount;
}

function onKeyDown(event){
    handleKeyDown(event.key);
}

function handleKeyDown(key) {
    // Start up game again. 
    if (gameOver) {
        startGameAfterGameOver();
        return;
    }
    var arrowObjectByInputKey = {'up': upPress, 'down': downPress, 'left': leftPress, 'right': rightPress};
    var inputsWeCareAbout = ['w','a','s','d','up','down','left','right'];
    var wasdToArrowKeys = {
        'w': 'up',
        'a': 'left',
        's': 'down',
        'd': 'right',
    }
    if (inputsWeCareAbout.includes(key)) {
        var direction = 'wasd'.includes(key) ? wasdToArrowKeys[key] : key;
        arrowObjectByInputKey[direction].strokeColor = "white";
        setTimeout(function () {arrowObjectByInputKey[direction].strokeColor = ""}, 100);

        if (correctAnswers.includes(direction)) {
            onCorrectAnswer();
        } else {
            onIncorrectAnswer();
        }
    }
}

function onIncorrectAnswer() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreText.content = 'Highscore: ' + highScore.toString();
    }
    currentTimeAmount = initialTimeAmount;
    clearWords();
    showGameOverText(score);
    showArrowKeys(false);
    progressBar.remove();
    endMusic.play();
    lastAnswer = "";
    gameOver = true;
    
    if (isMobile()) {
        canvas.addEventListener('click', function handler(event) {
            startGameAfterGameOver();
            event.currentTarget.removeEventListener(event.type, handler);
        });
    }
}

function onCorrectAnswer() {
    if (currentTimeAmount > 180) {
        currentTimeAmount -= 5;
    }
    score += 1;
    scoreText.content = 'Score: ' + score.toString(),
    correctMusic.play();
    clearWords();
    generateWords();
    resetTimer();
}

function startGameAfterGameOver() {
    score = 0;
    scoreText.content = 'Score: ' + score.toString(),
    gameOverTextEl.remove();
    showArrowKeys(true);
    generateWords();
    resetTimer();
    gameOver = false;
}

function showGameOverText(score) {
    var gameOverText = 'Game Over!\n Your score was: ' + score.toString() + (isMobile() ? '.\n\n Tap to play again.' :'.\n\n Press any key \nto play again.');
    var fontToUse = smallAnswerFontSize;
    gameOverTextEl = new PointText({
        point: paper.view.center + [0, -250],
        fillColor: 'white',
        content: gameOverText,
        fontSize: fontToUse,
        fontFamily: 'Roboto mono',
        justification: 'center',
    });    
}

function generateWords() {
    var canHaveNothing = score > scoreCanHaveNothing;
    var canHaveColors = score > scoreCanHaveColors;
    var canHaveOr = score > scoreCanHaveOr;
    var canHaveMultipleNots = score > scoreCanHaveMultipleNots;

    // Generates the words that determine which keys can be pressed. 
    // TODO(ling): refactor these values into config files or something. 
    var useNot = generateRandomBooleanWithProbability(1);
    var useAnotherNot = generateRandomBooleanWithProbability(canHaveMultipleNots ? 0.35 : 0);
    var useColor = generateRandomBooleanWithProbability(canHaveColors ? 0.5 : 0);
    var useNothing = generateRandomBooleanWithProbability(canHaveNothing ? 0.09 : 0);
    var useOr = generateRandomBooleanWithProbability(canHaveOr ? 0.3 : 0);
    var useAnything = generateRandomBooleanWithProbability(canHaveNothing ? 0.06 : 0);

    var combinedAnswerText = "";

    if (useNot) {
        combinedAnswerText += "not "
    }
    if (useAnotherNot) {
        combinedAnswerText += "not "
    }

    var notCount = Number(useAnotherNot) + Number(useNot);
    var finalUseNot = notCount % 2 === 1;

    // I guess "anything" takes precedence over nothing here.
    if (useAnything) {
        combinedAnswerText += "anything";
        if (lastAnswer === combinedAnswerText) {
            generateWords();
            return;
        }
        // TODO(ling): refactor to do this in shared fn. 
        setAnswerTextEl(combinedAnswerText);
        correctAnswers = finalUseNot ? [] : directions;
        return;
    }

    if (useNothing) {
        combinedAnswerText += "nothing";
        if (lastAnswer === combinedAnswerText) {
            generateWords();
            return;
        }
        setAnswerTextEl(combinedAnswerText);
        setCorrectAnswers(finalUseNot, useColor, directionOrColor, true, directionOrColor);
        return;
    } 

    var directionOrColor;
    if (useColor) {
        directionOrColor = getRandomElementFromArray(colors)
    } else {
        directionOrColor = getRandomElementFromArray(directions)
    }
    var secondDirectionOrColor;
    if (useOr) {
        var secondDirectionOrColor = getRandomDirectionOrColorExcludingDirectionOrColor(directionOrColor);
        combinedAnswerText += '(' + directionOrColor + ' or '+  secondDirectionOrColor + ')';
    } else {
        combinedAnswerText += directionOrColor;
    }
    if (lastAnswer === combinedAnswerText) {
        // Generate again with the hopes that we don't repeat. 
        generateWords();
        return;
    }
    setAnswerTextEl(combinedAnswerText);
    setCorrectAnswers(finalUseNot, useColor, directionOrColor, false, secondDirectionOrColor);
}

function showArrowKeys(shouldShowArrowKeys) {
    for (var i = 0; i < arrowKeys.length; i++) {
        arrowKeys[i].opacity = shouldShowArrowKeys ? 1 : 0;
    }
}

function setAnswerTextEl(answerText) {
    var fontScale = answerText.length > 16 ? 0.8 : 1;
    var fontToUse = isSmallScreen ? smallAnswerFontSize : answerFontSize;
    answerTextEl = new PointText({
        point: paper.view.center - [0, 200],
        fillColor: 'white',
        content: answerText,
        fontSize: fontToUse*fontScale,
        fontFamily: 'Roboto mono',
        justification: 'center',
    });    
    lastAnswer = answerText;
}

function setCorrectAnswers(useNot, useColor, directionOrColor, useNothing, secondDirectionOrColor) {
    var colorsToDirections = {
        'red': 'up',
        'yellow': 'right',
        'green': 'left',
        'blue': 'down',
    }
    correctAnswers = [];
    if (useNothing) {
        correctAnswers = useNot ? directions.slice() : [];
        return;
    }

    var direction; 
    if (useColor) {
        direction = colorsToDirections[directionOrColor];
    } else {
        direction = directionOrColor;
    }

    var secondDirection;
    if (secondDirectionOrColor) {
        if (colors.includes(secondDirectionOrColor)) {
            secondDirection = colorsToDirections[secondDirectionOrColor];
        } else {
            secondDirection = secondDirectionOrColor;
        }
    }

    if (useNot) {
        correctAnswers = directions.filter(function (dir) {
            return dir !== direction && dir !== secondDirection;
        });
    } else {
        correctAnswers = [direction, secondDirection];
    }
}

function clearWords() {
    if (answerTextEl) {
        answerTextEl.remove();
    }
}

// Utilities
function generateRandomBooleanWithProbability(probability) {
    return Math.random() < probability;
}

function getRandomElementFromArray(array) {
    var randomElement = array[Math.floor(Math.random() * array.length)];
    return randomElement;
}

function getRandomDirectionOrColorExcludingDirectionOrColor(directionOrColorToExclude) {
    var useColor = generateRandomBooleanWithProbability(0.5);
    var directionOrColor;
    if (useColor) {
        directionOrColor = getRandomElementFromArray(colors.filter(function (color){
            return color !== directionOrColorToExclude;
        }));
    } else {
        directionOrColor = getRandomElementFromArray(directions.filter(function (direction){
            return direction !== directionOrColorToExclude;
        }))
    }

    return directionOrColor;
}
