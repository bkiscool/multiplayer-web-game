let canvas;
let context;

let player;

let screenWidth;
let screenHeight;
let windowWidth;
let windowHeight;
let gameWidth;
let gameHeight;
let gameScale;

const screenObjects = new Array();

const isKeyDown = new Map();

let click_x;
let click_y;

function setGameScale()
{
    screenWidth = window.screen.width;
    screenHeight = window.screen.height;
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    gameWidth = Math.floor(Math.min(windowWidth * 0.90, 1920));
    gameHeight = Math.floor(Math.min(windowHeight * 0.90, 1080));
    gameScale = Math.min(gameWidth, gameHeight) * 0.01;

    //console.log("");
    //console.log("Window was resized.");
    //console.log("Here are the new values ->");

    //console.log("Screen width: " + screenWidth);
    //console.log("Screen height: " + screenHeight);
    //console.log("");
    //console.log("Window width: " + windowWidth);
    //console.log("Window height: " + windowHeight);
    //console.log("Game scale: " + gameScale);

    if (canvas == null) return;

    canvas.width = gameWidth;
    canvas.height = gameHeight;

}

window.onresize = setGameScale;

function viewportToGameCoordinates(x, y)
{
    const gameCoordinates = new Map();

    gameCoordinates.set("x", Math.floor(x - (windowWidth - gameWidth) / 2));
    gameCoordinates.set("y", Math.floor(y - (windowHeight - gameHeight) / 2));

    return gameCoordinates;
}

function onClick()
{
    if (player == undefined) return;
    if (isKeyDown.get("up")) return;
    if (isKeyDown.get("down")) return;
    if (isKeyDown.get("left")) return;
    if (isKeyDown.get("right")) return;

    //console.log("");
    //console.log("Moving player to (" + click_x + ", " + click_y + ")");
    //console.log("Player coordinates: (" + player.x + ", " + player.y + ")");

    if (player.x - click_x > 0)
    {
        player.x -= 1;
    } else if (player.x - click_x < 0)
    {
        player.x += 1;
    }

    if (player.y - click_y > 0)
    {
        player.y -= 1;
    } else if (player.y - click_y < 0)
    {
        player.y += 1;
    }

    if (player.x == click_x && player.y == click_y) return;

    window.requestAnimationFrame(onClick);
}

addEventListener("click", (event) => {
    const coords = viewportToGameCoordinates(event.x, event.y);

    click_x = coords.get("x");
    click_y = coords.get("y");

    //console.log("");
    //console.log("Moving player to (" + click_x + ", " + click_y + ")");

    onClick();
});

document.addEventListener("keydown", (event) => {
    let key = event.key.toString().toLowerCase();
    //console.log("Keydown: " + key);

    if (key === "w" || key === "arrowup") // UP
    {
        isKeyDown.set("up", true);

    }

    if (key === "s" || key === "arrowdown") // DOWN
    {
       isKeyDown.set("down", true);

    }
    
    if (key === "a" || key === "arrowleft") // LEFT
    {
        isKeyDown.set("left", true);

    }
    
    if (key === "d" || key === "arrowright") // RIGHT
    {
        isKeyDown.set("right", true);

    }

});

document.addEventListener("keyup", (event) => {
    let key = event.key.toString().toLowerCase();
    //console.log("Keyup: " + key);

    if (key === "w" || key === "arrowup") // UP
    {
        isKeyDown.set("up", false);

    }

    if (key === "s" || key === "arrowdown") // DOWN
    {
       isKeyDown.set("down", false);

    }
    
    if (key === "a" || key === "arrowleft") // LEFT
    {
        isKeyDown.set("left", false);

    }
    
    if (key === "d" || key === "arrowright") // RIGHT
    {
        isKeyDown.set("right", false);

    }

});

class ScreenObject {
    constructor(img_src, x, y)
    {
        //console.log("ScreenObject constructor ran!");

        this.img_src = img_src;
        this.x = x;
        this.y = y;
        this.img = new Image();
        this.img.src = this.img_src;
        this.img.onload = () => {
            let aspect_ratio = this.img.width / this.img.height;
            context.drawImage(this.img, this.x, this.y, aspect_ratio * gameScale * 10, (1 / aspect_ratio) * gameScale * 10);
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

    draw()
    {
        //console.log("Player draw method ran!");

        if (isKeyDown.get("up"))
        {
            this.y -= 1;
        }

        if (isKeyDown.get("down"))
        {
            this.y += 1;
        }

        if (isKeyDown.get("left"))
        {
            this.x -= 1;
        }

        if (isKeyDown.get("right"))
        {
            this.x += 1;
        }

        const aspect_ratio = this.img.width / this.img.height;
        const width = aspect_ratio * gameScale * 10;
        const height = (1 / aspect_ratio) * gameScale * 10;
        
        context.drawImage(this.img, this.x, this.y, width, height);

        context.fillStyle = "white";
        context.textAlign = "center";
        context.font = "15px arial";
        context.fillText(this.playername, this.x + width / 2, Math.floor(this.y - width * 0.05), width);

    }

}

async function update()
{
    if (screenObjects.length == 0) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (object of screenObjects)
    {
        object.draw();
    }

    await new Promise(r => setTimeout(r, 20));

    window.requestAnimationFrame(update);
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

    setGameScale();
    document.body.innerHTML = "<canvas id='canvas' width='" + gameWidth + "' height='" + gameHeight + "' style='background:#000000; position:absolute; padding:0; margin:auto; display:block; top:0; left:0; bottom:0; right:0;'></canvas>";

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    player = new Player(playername);

    update();
}
