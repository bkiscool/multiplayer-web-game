let canvas;
let context;

let player;

let screenWidth = window.screen.width;
let screenHeight = window.screen.height;

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let gameScale = Math.min(windowWidth, windowHeight) * 0.01;

let screenObjects = new Array();

function setGameScale()
{
    screenWidth = window.screen.width;
    screenHeight = window.screen.height;

    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    gameScale = Math.min(windowWidth, windowHeight) * 0.01;

    console.log("");
    console.log("Window was resized.");
    console.log("Here are the new values ->");

    console.log("Screen width: " + screenWidth);
    console.log("Screen height: " + screenHeight);
    console.log("");
    console.log("Window width: " + windowWidth);
    console.log("Window height: " + windowHeight);
    console.log("Game scale: " + gameScale);

    if (canvas == null) return;

    canvas.width = screenWidth;
    canvas.height = screenHeight;

}

window.onresize = setGameScale;

document.addEventListener("keydown", (event) => {
    let key = event.key.toString().toLowerCase();
    console.log("");
    console.log("Keypress: " + key);

    if (player == null)
    {

        return;
    }


    if (key === "w" || key === "arrowup") // UP
    {
        //console.log("UP pressed");
        player.y -= 1;



    } else if (key === "s" || key === "arrowdown") // DOWN
    {
        //console.log("DOWN pressed");
        player.y += 1;



    } else if (key === "a" || key === "arrowleft") // LEFT
    {
        //console.log("LEFT pressed");
        player.x -= 1;




    } else if (key === "d" || key === "arrowright") // RIGHT
    {
        //console.log("RIGHT pressed");
        player.x += 1;



    }

});

async function update()
{
    if (screenObjects.length == 0) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.rect(0, 0, 100000, 100000);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    for (object of screenObjects)
    {
        object.draw();
    }

    await new Promise(r => setTimeout(r, 20));
    window.requestAnimationFrame(update);
}

class ScreenObject {
    constructor(img_src, x, y)
    {
        console.log("ScreenObject constructor ran!");

        this.img_src = img_src;
        this.x = x;
        this.y = y;
        this.img = new Image();
        this.img.src = this.img_src;
        this.img.onload = () => {
            let aspect_ratio = img.width / img.height;
            context.drawImage(img, this.x, this.y, aspect_ratio * gameScale * 10, (1 / aspect_ratio) * gameScale * 10);
        };

        screenObjects.push(this);
    }

    draw()
    {
        console.log("ScreenObject draw method ran!");

        /*
        let img = new Image();

        img.onload = () => {
            let aspect_ratio = img.width / img.height;
            context.drawImage(img, this.x, this.y, aspect_ratio * gameScale * 10, (1 / aspect_ratio) * gameScale * 10);
        };
        */

        let aspect_ratio = this.img.width / this.img.height;
        context.drawImage(this.img, this.x, this.y, aspect_ratio * gameScale * 10, (1 / aspect_ratio) * gameScale * 10);

        //img.src = this.img_src;
    }

}

class Player extends ScreenObject {
    constructor(playername) {
        super("./favicon.ico", 0, 0);
        this.playername = playername;

        this.draw();
    }

    move(x_rel, y_rel) {
        this.object.move(x_rel, y_rel);

        console.log("");
        console.log("Player coordinates: (" + this.object.x + ", " + this.object.y + ")");
    }

}

function startGame()
{
    let playername = document.getElementById("playername-input").value;

    if (playername == "")
    {
        let randNum = Math.floor(Math.random() * 999999 - 100000) + 1000000;
        playername = "player" + randNum.toString();
    }

    console.log("Playername: " + playername);

    document.body.innerHTML = "<canvas id='canvas' width='" + screenWidth + "' height='" + screenHeight + "'></canvas>";

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");


    context.beginPath();
    context.rect(0, 0, 100000, 100000);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    player = new Player(playername);

    update();
}

