
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia || 
                          navigator.mozGetUserMedia || 
                          navigator.msGetUserMedia);

var audioCtx = new (window.AudioContext || window.wekitAudioContext)();

var source;
var stream;

var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.8;

var enemies = [];
var friends = [];
var mirrors = [];

var level = 0;
var id = 0;

function setLevel(l) {
    level = l;
    document.getElementById("level").innerHTML = l;
}

if (navigator.getUserMedia) {
    console.log("getUserMedia supported.");
    navigator.getUserMedia(
        { audio: true },
        function(stream) {
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            visualize();
        },
        function(err) {
            console.log("error: " + err);
        }
    );
} else {
    console.log("getUserMedia not supported.");
}

var canvas = document.getElementById("canvas-game");
var canvasCtx = canvas.getContext("2d");

function visualize() {
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    var effectiveLength = bufferLength * 0.25;
    var bottomOffset = 20;
    
    var barn = 5;
    var border = 100;
    
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    function draw() {
        var time;
        if (level >= 0) 
            time = requestAnimationFrame(draw);
        else
            alert("You've lost");
        analyser.getByteFrequencyData(dataArray);
        
        var maxi = 0;
        var max = 0;
        for (var i = bottomOffset; i < effectiveLength; i++) {
            if (dataArray[i] > max) {
                maxi = i;
                max = dataArray[i];
            }
        }
        var maxp = (1 - 3 * (maxi - bottomOffset) / (effectiveLength - bottomOffset)) * canvas.height;
        if (max > border) {
            for (var i = 0; i < enemies.length; i++) {
                var o = enemies[i];
                var diff = o.y - maxp;
                if (diff*diff < barn*barn*16) {
                    o.effect += 0.9;
                }
            }
        }
        
        for (var i = 0; i < enemies.length; i++) {
            var o = enemies[i];
            o.x -= o.vel;
            if (o.effect > 10) {
                enemies.splice(i--, 1);
                setLevel(level+1);
            }
            else if (o.x < 0) {
                enemies.splice(i--, 1);
                setLevel(level-1);
            }
        }
        for (var i = 0; i < friends.length; i++) {
            friends[i].x -= friends[i].vel;
        }
        for (var i = 0; i < mirrors.length; i++) {
            mirrors[i].x -= mirrors[i].vel;
        }
        
        var probabilityBorder = 1.0/(1.005 + level/1000.0)
        if (Math.random() > probabilityBorder) {
            var r = 0;//Math.random();
            var o = { x: canvas.width, y: Math.random() * canvas.height, vel: 0.5*Math.sqrt(level)+1, effect: 0, id: id++ };
            if (r < 0.33)
                enemies.push(o);
            else if (r < 0.66)
                friends.push(o);
            else
                mirrors.push(o);
        }
        
        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (max > border) {
            canvasCtx.fillStyle = 'rgb(90, 90, 90)';
            canvasCtx.fillRect(0, maxp - 5, canvas.width, 10);
        }
        
        canvasCtx.fillStyle = 'rgb(240, 0, 0)';
        for (var i = 0; i < enemies.length; i++) {
            var o = enemies[i];
            size = barn + o.effect;
            canvasCtx.fillRect(o.x - size/2, o.y - size/2 + Math.cos(time/50*o.effect+o.id) * o.effect, size, size);
        }
        canvasCtx.fillStyle = 'rgb(0, 240, 0)';
        for (var i = 0; i < friends.length; i++) {
            var o = friends[i];
            canvasCtx.fillRect(o.x - barn/2, o.y - barn/2, barn, barn);
        }
        canvasCtx.fillStyle = 'rgb(0, 0, 240)';
        for (var i = 0; i < mirrors.length; i++) {
            var o = mirrors[i];
            canvasCtx.fillRect(o.x - barn/2, o.y - barn/2, barn, barn);
        }
        
        var barHeight = (canvas.height / (effectiveLength-bottomOffset)) * 2.5;
        var barWidth;
        var y = 0;
        for (var i = bottomOffset; i < effectiveLength; i++) {
            barWidth = dataArray[i];
            canvasCtx.fillStyle = 'rgb(50,' + (barWidth+100) + ',50)';
            canvasCtx.fillRect(canvas.width - barWidth / 2, canvas.height - y, barWidth / 2, barHeight)
            y += barHeight + 1;
        }
    }
    draw();
}
