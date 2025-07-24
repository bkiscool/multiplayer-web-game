let canvas;
let context;

let player;

const UNIT_MAX_WIDTH = 1920;
const UNIT_MAX_HEIGHT = 1080;

let screenWidth;
let screenHeight;
let windowWidth;
let windowHeight;
let gameWidth;
let gameHeight;
let canvas_scale_x; // The ratio of canvas pixels to game pixels (will always be >= 1)
let canvas_scale_y;

const screenObjects = new Array();
const players = new Map(); // playername -> Player

const isKeyDown = new Map();

let click_x;
let click_y;

function setGameScale()
{
    screenWidth = window.screen.width;
    screenHeight = window.screen.height;
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    gameHeight = Math.min(windowHeight * 0.90, UNIT_MAX_HEIGHT);
    gameWidth = Math.min(windowWidth * 0.90, UNIT_MAX_WIDTH);
    if (gameWidth > gameHeight)
    {
        gameWidth = Math.min(gameHeight * 16 / 9, gameWidth);
    }
    gameHeight = Math.floor(gameWidth * 9 / 16);
    gameWidth = Math.floor(gameWidth);

    canvas_scale_x = UNIT_MAX_WIDTH / gameWidth;
    canvas_scale_y = UNIT_MAX_HEIGHT / gameHeight;

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

    
    //context.scale(1, 1);
    context.scale(1 / canvas_scale_x, 1 / canvas_scale_y);
    
    //console.log("");
    //console.log(`Canvas scale: (${canvas_scale_x}, ${canvas_scale_y})`);
    //console.log("Canvas width: " + canvas.width);
    //console.log("Canvas height: " + canvas.height);
    
}

window.onresize = setGameScale;

function gametoCanvasCoordinates(x, y)
{
    const coordinates = new Map();

    coordinates.set("x", x / canvas_scale_x);
    coordinates.set("y", y / canvas_scale_y);

    return coordinates;
}

function canvasToGameCoordinates(x, y)
{
    const coordinates = new Map();

    coordinates.set("x", Math.floor(x * canvas_scale_x));
    coordinates.set("y", Math.floor(y * canvas_scale_y));

    return coordinates;
}

function viewportToCanvasCoordinates(x, y)
{
    const coordinates = new Map();

    coordinates.set("x", x - (windowWidth - gameWidth) / 2);
    coordinates.set("y", y - (windowHeight - gameHeight) / 2);

    return coordinates;
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
    const canvas_coords = viewportToCanvasCoordinates(event.x, event.y);
    const game_coords = canvasToGameCoordinates(canvas_coords.get("x"), canvas_coords.get("y"));
    const bounded_coords = checkInBound(game_coords.get("x"), game_coords.get("y"));
    

    click_x = bounded_coords.x;
    click_y = bounded_coords.y;

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

function checkInBound(x, y)
    {
        let inBounds = true;
        let bounded_coords;

        if (x + player.img.width / 2 > UNIT_MAX_WIDTH)
        {
            x = Math.ceil(UNIT_MAX_WIDTH - player.img.width / 2);
            inBounds = false;
        } else if (x - player.img.width / 2 < 0)
        {
            x = 0 + Math.floor(player.img.width / 2);
            inBounds = false;
        }

        if (y > UNIT_MAX_HEIGHT)
        {
            y = UNIT_MAX_HEIGHT;
            inBounds = false;
        } else if (y - player.img.height < 0)
        {
            y = 0 + player.img.height;
            inBounds = false;
        }

        bounded_coords = {
            x: x,
            y: y
        };

        return bounded_coords;
    }

class ScreenObject {
    constructor(img_src, w, h, x, y)
    {
        //console.log("ScreenObject constructor ran!");

        this.img_src = img_src;
        this.x = x;
        this.y = y;
        this.img = new Image(w, h);
        this.img.src = this.img_src;

        this.img.onload = () => {};
        /*
        this.img.onload = () => {
            let aspect_ratio = this.img.width / this.img.height;
            context.drawImage(this.img, this.x, this.y, aspect_ratio * gameScale * 10, (1 / aspect_ratio) * gameScale * 10);
        };
        */

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
        context.drawImage(this.img, this.x, this.y, aspect_ratio * gameScale * 10, gameScale / aspect_ratio * 10);

        //img.src = this.img_src;
    }

}

class Player extends ScreenObject {
    constructor(playername, x, y) {
        super("./assets/favicon.ico", 75, 75, x, y);
        this.playername = playername;

        this.draw();

        players.set(this.playername, this);
    }

    draw()
    {
        //console.log("Player draw method ran!");

        if (isKeyDown.values().some(bool => bool))
        {
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

            const bounded_coords = checkInBound(this.x, this.y);
            this.x = bounded_coords.x;
            this.y = bounded_coords.y;

        }

        

        /*
        const aspect_ratio = this.img.width / this.img.height;
        const width = aspect_ratio * 75;
        const height = 75 / aspect_ratio;
        */
        const width = 75;
        const height = 75;
        
        context.drawImage(this.img, this.x - width / 2, this.y - height, width, height);

        context.fillStyle = "white";
        context.textAlign = "center";
        context.font = "16px Kranky";
        context.fillText(this.playername, this.x, this.y - height - 7, width + 20);

    }

    toJson()
    {
        const json = {
            playername: this.playername,
            x: this.x,
            y: this.y
        };

        return json;
    }

    delete()
    {
        try {
            screenObjects.splice(screenObjects.indexOf(this), 1);
            players.delete(this.playername);
            console.log("Removed player due to timeout: " + this.playername);
        } catch (error) {
            console.error("Error while trying to remove timedout player: ", error.message);
        }

    }

}

async function playerUpdate()
{
    const payload = {
        playername: player.playername,
        x: player.x,
        y: player.y
    };

    //console.log("Payload stringify: " + JSON.stringify(payload));

    const response = await fetch("/api/player-update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(json => {
        const data = JSON.stringify(json);
        //console.log("response: " + data);
    });

}

async function getUpdatedPlayers()
{
    const response = await fetch("/api/updated-players", {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })
    .then(response => response.json())
    .then(json => {
        const data = JSON.stringify(json);
        //console.log("Response: " + data);

        const server_players = json.players;
        //console.log("Server players: " + JSON.stringify(server_players));

        for (otherPlayer of server_players)
        {
            if (!players.has(otherPlayer.playername)) continue;
            if (otherPlayer.playername == player.playername) continue;

            const playerObject = players.get(otherPlayer.playername);
            playerObject.x = otherPlayer.x;
            playerObject.y = otherPlayer.y;
        }

    });

}

async function keepalive()
{
    const payload = player.toJson();
    const timestamp = new Date().getTime();

    //console.log("Payload stringify: " + JSON.stringify(payload));

    const response = await fetch("/api/keepalive", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Timestamp": `${timestamp}`
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(json => {
        const data = JSON.stringify(json);
        //console.log("response: " + data);
    });

    await new Promise(r => setTimeout(r, 1000));

    window.requestAnimationFrame(keepalive);
}

async function getConnectedPlayers()
{
    const response = await fetch("/api/connected-players", {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })
    .then(response => response.json())
    .then(json => {
        const data = JSON.stringify(json);
        //console.log("Response: " + data);

        const server_players = json.players;
        const connectedPlayers = server_players.map(otherPlayer => otherPlayer.playername);
        //console.log("Server players: " + JSON.stringify(server_players));
        //console.log("Server playernames: " + connectedPlayers.toString());

        for (otherPlayer of server_players)
        {
            if (players.has(otherPlayer.playername)) continue;

            //console.log("New player from server: " + otherPlayer.playername);
            new Player(otherPlayer.playername, otherPlayer.x, otherPlayer.y);
        }

        const timedout = new Array();
        players.keys().forEach(playername => {
            if (connectedPlayers.includes(playername)) return;
            if (playername == player.playername) return;

            timedout.push(playername);
        });

        timedout.forEach(playername => players.get(playername).delete());

    });

    await new Promise(r => setTimeout(r, 1000));

    window.requestAnimationFrame(getConnectedPlayers);

}

async function update()
{
    if (screenObjects.length == 0) return;

    context.clearRect(0, 0, UNIT_MAX_WIDTH, UNIT_MAX_HEIGHT);

    playerUpdate();
    getUpdatedPlayers();

    for (object of screenObjects)
    {
        object.draw();
    }

    await new Promise(r => setTimeout(r, 20));

    window.requestAnimationFrame(update);
}

async function checkPlayername(playername)
{
    if (playername == "")
    {
        let randNum = Math.floor(Math.random() * 999999 - 100000) + 1000000;
        playername = "player" + randNum.toString();

        return playername;
    }

    if (playername.length > 13)
    {
        document.getElementById("error").innerHTML = "Error:";
        document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername cannot be longer than 13 characters.`
        return;
    }

    if (playername.length < 2)
    {
        document.getElementById("error").innerHTML = "Error:";
        document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername must be at least 2 characters long.`
        return;
    }

    const specialCharactersMatch = playername.match(/\W/);
    if (specialCharactersMatch != null)
    {
        document.getElementById("error").innerHTML = "Error:";
        document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername can only contain letters, numbers, and underscores.`
        return;
    }

    const letterMatch = playername.match(/[a-zA-Z0-9]/);
    if (letterMatch == null)
    {
        document.getElementById("error").innerHTML = "Error:";
        document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername must contain at least 1 letter or number.`
        return;
    }

    const payload = {
        playername: playername
    };

    const response = await fetch("/api/profanity-check", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    const hasProfanity = data.hasProfanity;

    if (hasProfanity)
    {
        document.getElementById("error").innerHTML = "Error:";
        document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername cannot contain profanity.`
        return;
    }

    return playername;
}

async function startGame()
{
    let playername = document.getElementById("playername-input").value;
    playername = await checkPlayername(playername);

    if (playername == undefined) return;

    console.log("Playername: " + playername);

    document.body.innerHTML = `<canvas id='canvas' width='${UNIT_MAX_WIDTH}' height='${UNIT_MAX_HEIGHT}' style='background:#000000; position:absolute; padding:0; margin:auto; display:block; top:0; left:0; bottom:0; right:0;'></canvas>`;

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    setGameScale();

    player = new Player(playername, 200, 200);

    update();
    playerUpdate();
    getConnectedPlayers();
    keepalive();
}
