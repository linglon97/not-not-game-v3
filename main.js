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

var upPress = new Path.RegularPolygon(new Point(canvasWidth/2, canvasHeight-450), 3, 50)
upPress.strokeWidth = 5;

upPress.opacity = 1;
upPress.fillColor = 'red';
upPress.onMouseDown = function(event) {
    handleKeyDown('up');
}

var downPress = new Path.RegularPolygon(new Point(canvasWidth/2, canvasHeight-150), 3, 50)
downPress.strokeWidth = 5;

downPress.opacity = 1;
downPress.rotate(180);
downPress.fillColor = 'blue';
downPress.onMouseDown = function(event) {
    handleKeyDown('down');
}

var leftPress= new Path.RegularPolygon(new Point(canvasWidth/2-200, canvasHeight-300), 3, 50)
leftPress.strokeWidth = 5;

leftPress.opacity = 1; 
leftPress.rotate(270);
leftPress.fillColor = 'green'
leftPress.onMouseDown = function(event) {
    handleKeyDown('left');
}

var rightPress= new Path.RegularPolygon(new Point(canvasWidth/2+200, canvasHeight-300), 3, 50)
rightPress.strokeWidth = 5;

rightPress.opacity = 1;
rightPress.rotate(90);
rightPress.fillColor = 'yellow';
rightPress.onMouseDown = function(event) {
    handleKeyDown('right');
}

var border = new Shape.Rectangle(new Point(Math.floor(20), Math.floor(20)), new Size(view.size.width-40,view.size.height-40));
border.strokeColor = 'white';
border.strokeWidth = '5';

var localStorage = window.localStorage;
var persistedHighScoreAllTime = localStorage.getItem('highScore');
var highScore = 0;

if (persistedHighScoreAllTime) {
    highScore = persistedHighScoreAllTime;
}

// Global variables
var score = 0;
var initialTimeAmount = 500;
var currentTimeAmount = initialTimeAmount;
var gameOver = false;
var timer = initialTimeAmount;
var notText;
var anotherNotText;
var colorText;
var directionsText;
var nothingText;
var correctAnswers = [];
var colors = ['red', 'green', 'blue', 'yellow'];
var directions = ['up', 'down', 'left', 'right'];

// Text that depends on game variables
var timerText = new PointText({
	point: [1500, 900],
	fillColor:'white',
	content: timer.toString(),
	fontSize: 25,
	opacity: 1,
})

var scoreText = new PointText({
	point: [100, 900],
	fillColor:'white',
	content: 'Score: ' + score.toString(),
	fontSize: 50,
	opacity: 1,
});

var highScoreText = new PointText({
	point: [100, 100],
	fillColor: 'white',
	content: 'Highscore: ' + highScore.toString(),
	fontSize: 25,
	opacity: 1,
});

// Start game?
generateWords();

function onFrame(){
    timer -= 1;
    timerText.content = timer.toString();

    if (timer === 0) {
        if (correctAnswers.length === 0) {
            onCorrectAnswer();
        } else {
            onIncorrectAnswer();
        }
    }
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
        currentTimeAmount -= 10;
    }
    score += 1;
    scoreText.content = 'Score: ' + score.toString(),
    correctMusic.play();
    clearWords();
    generateWords(score > 20);
    resetTimer();
}

function generateWords(canHaveOr) {
    // Generates either "not" or "" + a random color/direction
    var useNot = generateRandomBooleanWithProbability(0.35);
    var useAnotherNot = generateRandomBooleanWithProbability(0.35);
    var useColor = generateRandomBooleanWithProbability(0.5);
    var useNothing = generateRandomBooleanWithProbability(0.1);
    var useOr = generateRandomBooleanWithProbability(canHaveOr ? 0.3 : 0);

    if (useNot) {
        // Draw the not
        notText = new PointText({
            fillColor: 'white',
            point:[440, 350],
            opacity: 1, 
            content: 'NOT',
            fontSize: 75
        });
    }
    if (useAnotherNot) {
        // Draw the not
        anotherNotText = new PointText({
            fillColor: 'white',
            point:[640, 350],
            opacity: 1,
            content: 'NOT',
            fontSize: 75
        });
    }

    var notCount = Number(useAnotherNot) + Number(useNot);
    var finalUseNot = notCount % 2 === 1;

    if (useNothing) {
        nothingText = new PointText({
            fillColor: 'white',
            point:[840, 350],
            opacity: 1,
            content: 'NOTHING',
            fontSize: 75
        });
        setCorrectAnswers(finalUseNot, useColor, directionOrColor, true, directionOrColor);
        return;
    } 

    var directionOrColor;
    if (useColor) {
        directionOrColor = getRandomElementFromArray(colors)
        colorText = new PointText({
            fillColor: 'white',
            point:[1040, 350],
            opacity: 1,
            content: directionOrColor.toUpperCase(),
            fontSize: 75
        });
    } else {
        directionOrColor = getRandomElementFromArray(directions)
        directionsText = new PointText({
            fillColor: 'white',
            point:[1040, 350],
            opacity: 1,
            content: directionOrColor.toUpperCase(),
            fontSize: 75
        });
    }
    
    var secondDirectionOrColor;
    if (useOr) {
        var secondDirectionOrColor = getRandomDirectionOrColorExcludingDirectionOrColor(directionOrColor);
        if (useColor) {
            colorText.content = '(' + directionOrColor.toUpperCase() + ' OR '+  secondDirectionOrColor.toUpperCase() + ')';
        } else {
            directionsText.content = '(' +  directionOrColor.toUpperCase() + ' OR ' +  secondDirectionOrColor.toUpperCase() + ')';
        }
    }

    setCorrectAnswers(finalUseNot, useColor, directionOrColor, false, secondDirectionOrColor);
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
    var words = [notText, anotherNotText, nothingText, colorText, directionsText];

    for (var i = 0; i < words.length; i++) {
        if (words[i]){
            words[i].remove();
        }
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
