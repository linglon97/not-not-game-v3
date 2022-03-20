//music
var correctMusic = new Howl({
    src:['sounds/pinwheel.mp3'],
    volume: 0.5,
});

var endMusic = new Howl({
    src:['sounds/piston-1.mp3'],
    volume: 0.5,
});

// Draw the arrow keys
var canvas = document.getElementById('myCanvas');

var canvasWidth = canvas.width;
var canvasHeight = canvas.height;

// We use the borders bounds to position elements inside.
var border = new Shape.Rectangle(new Point(Math.floor(20), Math.floor(20)), new Size(view.size.width-40,view.size.height-40));
border.strokeColor = 'white';
border.strokeWidth = '3';

var centerX = border.size.width/2;
var centerY = border.size.height/2;

var upPress = new Path.RegularPolygon(new Point(paper.view.center.x, border.size.height-350), 3, 50)
upPress.strokeWidth = 5;

upPress.opacity = 1;
upPress.fillColor = 'red';
upPress.onMouseDown = function(event) {
    handleKeyDown('up');
}

var downPress = new Path.RegularPolygon(new Point(paper.view.center.x, border.size.height-100), 3, 50)
downPress.strokeWidth = 5;

downPress.opacity = 1;
downPress.rotate(180);
downPress.fillColor = 'blue';
downPress.onMouseDown = function(event) {
    handleKeyDown('down');
}

var leftPress= new Path.RegularPolygon(new Point(paper.view.center.x - 200, border.size.height-225), 3, 50)
leftPress.strokeWidth = 5;

leftPress.opacity = 1; 
leftPress.rotate(270);
leftPress.fillColor = 'green'
leftPress.onMouseDown = function(event) {
    handleKeyDown('left');
}

var rightPress= new Path.RegularPolygon(new Point(paper.view.center.x + 200, border.size.height-225), 3, 50)
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

var progressBar = new Shape.Rectangle(new Point(0, 50), [border.size.width + 50, 50]);
progressBar.fillColor = 'white';

// Configuration/variables 
var scoreCanHaveOr = 10;
var scoreCanHaveNothing = 7;
var initialTimeAmount = 450;
var answerFontSize = 75;
var smallAnswerFontSize = 75/1.5;

// Global variables for game state, objects, etc.
var score = 0;
var currentTimeAmount = initialTimeAmount;
var gameOver = false;
var timer = initialTimeAmount;
var answerTextEl;

var correctAnswers = [];
var colors = ['red', 'green', 'blue', 'yellow'];
var directions = ['up', 'down', 'left', 'right'];

// Text that depends on game variables
// var timerText = new PointText({
// 	point: [canvasWidth/2 - 20, canvasHeight-300],
// 	fillColor:'white',
// 	content: (timer).toString().substring(0,3),
// 	fontSize: 12,
//     fontFamily: 'Roboto mono',
// })

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
    var standardDelta = 1/200;
    // Time in seconds since last frame render
    var delta = event.delta;
    var timeMultipler = delta/standardDelta;
    // If i'm 200 fps then timer goes down every 1/200s.
    // If i'm 60 fps then timer goes down every 1/60s. 
    // So I want the timer to roughly be calibrated so the timer goes down faster,
    // So the time is takes is roughly the same. 
    timer -= timeMultipler;
    // timerText.content = (Math.floor(timer)).toString(),
    console.log((timer/currentTimeAmount));
    progressBar.size = [(canvasWidth) * (timer/currentTimeAmount), 50]
    // progressBar.opacity = (timer/currentTimeAmount);
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
    score = 0;
    scoreText.content = 'Score: ' + score.toString(),
    endMusic.play();
    clearWords();
    generateWords();
    resetTimer();
}

function onCorrectAnswer() {
    if (currentTimeAmount > 120) {
        currentTimeAmount -= 5;
    }
    score += 1;
    scoreText.content = 'Score: ' + score.toString(),
    correctMusic.play();
    clearWords();
    generateWords(score > scoreCanHaveOr, score > scoreCanHaveNothing);
    resetTimer();
}

function generateWords(canHaveOr, canHaveNothing) {
    // Generates either "not" or "" + a random color/direction
    var useNot = generateRandomBooleanWithProbability(0.35);
    var useAnotherNot = generateRandomBooleanWithProbability(0.35);
    var useColor = generateRandomBooleanWithProbability(0.5);
    var useNothing = generateRandomBooleanWithProbability(canHaveNothing ? 0.1 : 0);
    var useOr = generateRandomBooleanWithProbability(canHaveOr ? 0.3 : 0);

    var combinedAnswerText = "";
    if (useNot) {
        combinedAnswerText += "not "
    }
    if (useAnotherNot) {
        combinedAnswerText += "not "
    }

    var notCount = Number(useAnotherNot) + Number(useNot);
    var finalUseNot = notCount % 2 === 1;

    if (useNothing) {
        combinedAnswerText += "Nothing";
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
        if (useColor) {
            combinedAnswerText += '(' + directionOrColor.toUpperCase() + ' OR '+  secondDirectionOrColor.toUpperCase() + ')';
        } else {
            combinedAnswerText.content += '(' +  directionOrColor.toUpperCase() + ' OR ' +  secondDirectionOrColor.toUpperCase() + ')';
        }
    } else {
        combinedAnswerText += directionOrColor;
    }
    setAnswerTextEl(combinedAnswerText);
    setCorrectAnswers(finalUseNot, useColor, directionOrColor, false, secondDirectionOrColor);
}

function setAnswerTextEl(answerText) {
    var isSmallScreen = canvas.width < 600;
    var fontToUse = isSmallScreen ? smallAnswerFontSize : answerFontSize;
    var answerTextXOffset = answerText.length % 2 === 0 ? 0 : fontToUse/2;
    answerTextEl = new PointText({
        point: paper.view.center + [-(answerText.length/2)*fontToUse/2- 25, -200],
        fillColor: 'white',
        content: answerText,
        fontSize: isSmallScreen ? smallAnswerFontSize : answerFontSize,
        fontFamily: 'Roboto mono',
    });    
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
