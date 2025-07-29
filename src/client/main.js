/**
 * @typedef {Object} JSON
 */
class Model {

    /** @type {Map<string, Player} */
    players = new Map();

    /** @type {Player} */
    player;
    /** @type {string} */
    playername;

    constructor()
    {

    }

    /**
     * 
     * @returns {string|undefined}
     */
    async processPlayername()
    {
        let playername = document.getElementById("playername-input").value;

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
            return undefined;
        }

        if (playername.length < 2)
        {
            document.getElementById("error").innerHTML = "Error:";
            document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername must be at least 2 characters long.`
            return undefined;
        }

        const specialCharactersMatch = playername.match(/\W/);
        if (specialCharactersMatch != null)
        {
            document.getElementById("error").innerHTML = "Error:";
            document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername can only contain letters, numbers, and underscores.`
            return undefined;
        }

        const letterMatch = playername.match(/[a-zA-Z0-9]/);
        if (letterMatch == null)
        {
            document.getElementById("error").innerHTML = "Error:";
            document.getElementById("error-message").innerHTML = `[${new Date().toLocaleTimeString()}] Playername must contain at least 1 letter or number.`
            return undefined;
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
            return undefined;
        }

        console.log("Playername: " + playername);

        this.playername = playername;
        
        return playername;
    }

    createPlayer()
    {
        this.player = new Player(this.playername, 200, 200);
    }

    /**
     * 
     * @returns {Player}
     */
    getPlayer()
    {
        return this.player;
    }

    /**
     * 
     * @param {string} playername 
     * @param {Player} player 
     */
    addPlayer(playername, player)
    {
        this.players.set(playername, player);
    }

    /**
     * 
     * @param {Player} player 
     */
    removePlayer(player)
    {
        this.players.delete(player.playername);
    }

    async playerUpdate()
    {
        const payload = {
            playername: this.player.playername,
            x: this.player.x,
            y: this.player.y
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

    async requestPlayers()
    {
        const response = await fetch("/api/players", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        })
        .then(response => response.json())
        .then(json => {
            const data = JSON.stringify(json);
            //console.log("Response: " + data);

            /** @type {Array<JSON>} */
            const server_players = json.players;
            //console.log("Server players: " + JSON.stringify(server_players));

            for (const otherPlayer of server_players)
            {
                if (!this.players.has(otherPlayer.playername)) continue;
                if (otherPlayer.playername == this.player.playername) continue;

                const playerObject = this.players.get(otherPlayer.playername);
                playerObject.x = otherPlayer.x;
                playerObject.y = otherPlayer.y;
            }

        });

    }

    async keepalive()
    {
        const payload = this.player.toJson();
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

    }

    async requestConnectedPlayers()
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

            /** @type {Array[JSON]} */
            const server_players = json.players;
            const connectedPlayers = server_players.map(otherPlayer => otherPlayer.playername);
            //console.log("Server players: " + JSON.stringify(server_players));
            //console.log("Server playernames: " + connectedPlayers.toString());

            for (const otherPlayer of server_players)
            {
                if (this.players.has(otherPlayer.playername)) continue;

                //console.log("New player from server: " + otherPlayer.playername);
                new Player(otherPlayer.playername, otherPlayer.x, otherPlayer.y);
            }

            const timedout = new Array();
            this.players.keys().forEach(playername => {
                if (connectedPlayers.includes(playername)) return;
                if (playername == this.player.playername) return;

                timedout.push(playername);
            });

            timedout.forEach(playername => this.players.get(playername).remove());

        });

    }

}

class View {
    static UNIT_MAX_WIDTH = 1920;
    static UNIT_MAX_HEIGHT = 1080;

    /** @type {number} */
    static windowWidth
    /** @type {number} */
    static windowHeight;
    /** @type {number} */
    static gameWidth;
    /** @type {number} */
    static gameHeight;
    /** @type {number} */
    static canvas_scale_x; // The ratio of canvas pixels to game pixels (will always be >= 1)
    /** @type {number} */
    static canvas_scale_y; // Same here

    /** @type {Array<ScreenObject>} */
    screenObjects = new Array();

    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    context;

    constructor()
    {
        
    }

    createCanvas()
    {
        document.body.innerHTML = `<canvas id='canvas' width='${View.UNIT_MAX_WIDTH}' height='${View.UNIT_MAX_HEIGHT}' style='background:#000000; position:absolute; padding:0; margin:auto; display:block; top:0; left:0; bottom:0; right:0;'></canvas>`;

        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");
    }

    clearCanvas()
    {
        this.context.clearRect(0, 0, View.UNIT_MAX_WIDTH, View.UNIT_MAX_HEIGHT);
    }

    draw()
    {
        this.clearCanvas();
        this.screenObjects.forEach(object => object.draw());
        
    }

    /**
     * 
     * @param {CanvasImageSource} img 
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     */
    drawImage(img, x, y, w, h)
    {
        this.context.drawImage(img, x, y, w, h);
    }

    /**
     * 
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {number} max_width 
     * @param {function text_options({CanvasRenderingContext2D})} {
        
     }} text_options 
     */
    drawText(text, x, y, max_width, text_options)
    {
        text_options(this.context);
        this.context.fillText(text, x, y, max_width);
    }

    setGameScale()
    {
        View.windowWidth = window.innerWidth;
        View.windowHeight = window.innerHeight;

        View.gameHeight = Math.min(View.windowHeight * 0.90, View.UNIT_MAX_HEIGHT);
        View.gameWidth = Math.min(View.windowWidth * 0.90, View.UNIT_MAX_WIDTH);
        if (View.gameWidth > View.gameHeight)
        {
            View.gameWidth = Math.min(View.gameHeight * 16 / 9, View.gameWidth);
        }
        View.gameHeight = Math.floor(View.gameWidth * 9 / 16);
        View.gameWidth = Math.floor(View.gameWidth);

        View.canvas_scale_x = View.UNIT_MAX_WIDTH / View.gameWidth;
        View.canvas_scale_y = View.UNIT_MAX_HEIGHT / View.gameHeight;

        //console.log("");
        //console.log("Window was resized.");
        //console.log("Here are the new values ->");

        //console.log("Screen width: " + screenWidth);
        //console.log("Screen height: " + screenHeight);
        //console.log("");
        //console.log("Window width: " + windowWidth);
        //console.log("Window height: " + windowHeight);
        //console.log("Game scale: " + gameScale);

        if (this.canvas == null) return;

        this.canvas.width = View.gameWidth;
        this.canvas.height = View.gameHeight;

        
        //context.scale(1, 1);
        this.context.scale(1 / View.canvas_scale_x, 1 / View.canvas_scale_y);
        
        //console.log("");
        //console.log(`Canvas scale: (${canvas_scale_x}, ${canvas_scale_y})`);
        //console.log("Canvas width: " + canvas.width);
        //console.log("Canvas height: " + canvas.height);
        
    }

    /**
     * 
     * @param {ScreenObject} screenObject 
     */
    addScreenObject(screenObject)
    {
        this.screenObjects.push(screenObject);
    }

    /**
     * 
     * @param {ScreenObject} screenObject 
     */
    removeScreenObject(screenObject)
    {
        this.screenObjects.splice(this.screenObjects.indexOf(screenObject), 1);
    }

}

class Controller {

    static BASE_VELOCITY = 3; // Game coordinates per tick

    /** @type {Model} */
    model;
    /** @type {View} */
    view;

    /** @type {Map<string, bool} */
    isKeyDown = new Map();
    /** @type {number} */
    click_x;
    /** @type {number} */
    click_y;

    /**
     * 
     * @param {Model} model 
     * @param {View} view 
     */
    constructor(model, view)
    {
        this.model = model;
        this.view = view;

    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {Map<string, number}
     */
    static gametoCanvasCoordinates(x, y)
    {
        const coordinates = new Map();

        coordinates.set("x", x / View.canvas_scale_x);
        coordinates.set("y", y / View.canvas_scale_y);

        return coordinates;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {Map<string, number}
     */
    static canvasToGameCoordinates(x, y)
    {
        const coordinates = new Map();

        coordinates.set("x", Math.floor(x * View.canvas_scale_x));
        coordinates.set("y", Math.floor(y * View.canvas_scale_y));

        return coordinates;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {Map<string, number}
     */
    static viewportToCanvasCoordinates(x, y)
    {
        const coordinates = new Map();

        coordinates.set("x", x - (View.windowWidth - View.gameWidth) / 2);
        coordinates.set("y", y - (View.windowHeight - View.gameHeight) / 2);

        return coordinates;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {JSON}
     */
    static checkInBounds(x, y)
    {
        const player = model.getPlayer();
        let inBounds = true;
        let bounded_coords;

        if (x + player.img.width / 2 > View.UNIT_MAX_WIDTH)
        {
            x = Math.ceil(View.UNIT_MAX_WIDTH - player.img.width / 2);
            inBounds = false;
        } else if (x - player.img.width / 2 < 0)
        {
            x = 0 + Math.floor(player.img.width / 2);
            inBounds = false;
        }

        if (y > View.UNIT_MAX_HEIGHT)
        {
            y = View.UNIT_MAX_HEIGHT;
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

    /** @type {JSON} */
    lastClickTime = new Object();
    doubleClickThreshold = 200; // 200ms

    calculateVelocity(key)
    {
        const player_velocity = model.getPlayer().getVelocity();

        if (player_velocity >= Controller.BASE_VELOCITY * 2) return player_velocity;

        const now = new Date();
        let velocity = (now - this.lastClickTime[key] < this.doubleClickThreshold) ? Controller.BASE_VELOCITY * 2 : Controller.BASE_VELOCITY;
        this.lastClickTime[key] = now;

        return velocity;
    }
    
    /**
     * 
     * @param {MouseEvent} event 
     */
    onMouseDown(event)
    {
        const key = event.button;
        if (key != 0 && key != 2) return;

        const player = model.getPlayer();
        const now = new Date();
        let velocity = this.calculateVelocity(key);
        player.setVelocity(velocity);

        const canvas_coords = Controller.viewportToCanvasCoordinates(event.x, event.y);
        const game_coords = Controller.canvasToGameCoordinates(canvas_coords.get("x"), canvas_coords.get("y"));
        const bounded_coords = Controller.checkInBounds(game_coords.get("x"), game_coords.get("y"));
        

        this.click_x = bounded_coords.x;
        this.click_y = bounded_coords.y;

        //console.log("");
        //console.log("Moving player to (" + click_x + ", " + click_y + ")");

        this.move();
    }

    allowedKeys = ["w", "arrowup", "s", "arrowdown", "a", "arrowleft", "d", "arrowright"];

    /**
     * 
     * @param {KeyboardEvent} event 
     */
    onKeyDown(event)
    {
        let key = event.key.toString().toLowerCase();

        if (!this.allowedKeys.includes(key)) return;

        const player = model.getPlayer();
        const now = new Date();
        //console.log("Keydown: " + key);

        let velocity = this.calculateVelocity(key);

        if ((key === "w" || key === "arrowup") && !this.isKeyDown.get("up")) // UP
        {
            this.isKeyDown.set("up", true);
            player.setVelocity(velocity);
        }

        if ((key === "s" || key === "arrowdown") && !this.isKeyDown.get("down")) // DOWN
        {
            this.isKeyDown.set("down", true);
            player.setVelocity(velocity);
        }
        
        if ((key === "a" || key === "arrowleft") && !this.isKeyDown.get("left")) // LEFT
        {
            this.isKeyDown.set("left", true);
            player.setVelocity(velocity);
        }
        
        if ((key === "d" || key === "arrowright") && !this.isKeyDown.get("right")) // RIGHT
        {
            this.isKeyDown.set("right", true);
            player.setVelocity(velocity);
        }

    }

    /**
     * 
     * @param {KeyboardEvent} event 
     */
    onKeyUp(event)
    {
        let key = event.key.toString().toLowerCase();
        //console.log("Keyup: " + key);

        if (key === "w" || key === "arrowup") // UP
        {
            this.isKeyDown.set("up", false);
        }

        if (key === "s" || key === "arrowdown") // DOWN
        {
            this.isKeyDown.set("down", false);
        }
        
        if (key === "a" || key === "arrowleft") // LEFT
        {
            this.isKeyDown.set("left", false);
        }
        
        if (key === "d" || key === "arrowright") // RIGHT
        {
            this.isKeyDown.set("right", false);
        }

    }

    move()
    {
        const player = model.getPlayer();

        if (player == undefined) return;
        
        if (this.isKeyDown.values().some(bool => bool))
        {
            let velocity = player.getVelocity();

            if (this.isKeyDown.get("up"))
            {
                player.y -= velocity;
            }

            if (this.isKeyDown.get("down"))
            {
                player.y += velocity;
            }

            if (this.isKeyDown.get("left"))
            {
                player.x -= velocity;
            }

            if (this.isKeyDown.get("right"))
            {
                player.x += velocity;
            }

            const bounded_coords = Controller.checkInBounds(player.x, player.y);
            player.x = bounded_coords.x;
            player.y = bounded_coords.y;

            this.click_x = player.x;
            this.click_y = player.y;

            return;
        }

        //console.log("");
        //console.log("Moving player to (" + this.click_x + ", " + this.click_y + ")");
        //console.log("Player coordinates: (" + player.x + ", " + player.y + ")");

        let velocity = player.getVelocity();

        if (player.x - this.click_x > 0)
        {
            player.x -= velocity;
        } else if (player.x - this.click_x < 0)
        {
            player.x += velocity;
        }

        if (player.y - this.click_y > 0)
        {
            player.y -= velocity;
        } else if (player.y - this.click_y < 0)
        {
            player.y += velocity;
        }

        if (Math.abs(player.x - this.click_x) <= velocity && player.x != this.click_x)
        {
            player.x = this.click_x;
        }

        if (Math.abs(player.y - this.click_y) <= velocity && player.y != this.click_y)
        {
            player.y = this.click_y;
        }

        if (player.x == this.click_x && player.y == this.click_y)
        {
            player.setVelocity(0);
        }

    }

}

class ScreenObject {

    /**
     * 
     * @param {string} img_src 
     * @param {number} w 
     * @param {number} h 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(img_src, w, h, x, y)
    {
        //console.log("ScreenObject constructor ran!");

        this.img_src = img_src;
        this.x = x;
        this.y = y;
        this.img = new Image(w, h);
        this.img.src = this.img_src;

        this.img.onload = () => {};

        view.addScreenObject(this);
    }

    draw()
    {
        console.log("ScreenObject draw method ran!");

        let aspect_ratio = this.img.width / this.img.height;
        view.drawImage(this.img, this.x, this.y, aspect_ratio * gameScale * 10, gameScale / aspect_ratio * 10);

    }

}

class Player extends ScreenObject {

    /**
     * 
     * @param {string} playername 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(playername, x, y) {
        super("./assets/favicon.ico", 75, 75, x, y);
        this.playername = playername;
        this.velocity = 0;

        this.draw();

        model.addPlayer(this.playername, this);
    }

    draw()
    {
        //console.log("Player draw method ran!");

        const aspect_ratio = this.img.width / this.img.height;
        const width = aspect_ratio * 75;
        const height = 75 / aspect_ratio;

        view.drawText(this.playername, this.x, this.y - height - 7, width + 20, (/** @type {CanvasRenderingContext2D} */context) => {
            context.fillStyle = "white";
            context.textAlign = "center";
            context.font = "16px Kranky";
        });
        view.drawImage(this.img, this.x - width / 2, this.y - height, width, height);

    }

    /**
     * 
     * @returns {JSON}
     */
    toJson()
    {
        const json = {
            playername: this.playername,
            x: this.x,
            y: this.y
        };

        return json;
    }

    remove()
    {
        view.removeScreenObject(this);
        model.removePlayer(this);

    }

    getVelocity()
    {
        //console.log(this.velocity);
        return this.velocity;
    }

    setVelocity(velocity)
    {
        this.velocity = velocity;
    }

}

const ticks_per_second = 50;
const timeout = 1000 / ticks_per_second;
let ticks = 0;
let realtime = 0;
let timer_1000_milliseconds = 0;
let timer_200_milliseconds = 0;
async function gameLoop()
{
    if (timer_1000_milliseconds >= 1000)
    {
        model.requestConnectedPlayers();
        model.keepalive();
    }

    model.playerUpdate();
    model.requestPlayers();

    view.draw();
    controller.move(); // Uses timer_200_milliseconds

    if (timer_1000_milliseconds >= 1000)
    {
        timer_1000_milliseconds = 0;
    }

    if (timer_200_milliseconds >= 200)
    {
        timer_200_milliseconds = 0;
    }

    await new Promise(r => setTimeout(r, timeout));

    ticks += 1;
    realtime += timeout;
    timer_1000_milliseconds += timeout;
    timer_200_milliseconds += timeout;

    window.requestAnimationFrame(gameLoop);
}

async function startGame()
{
    playername = model.processPlayername();

    if (playername == undefined) return;

    view.createCanvas();
    view.setGameScale();

    model.createPlayer();

    window.requestAnimationFrame(gameLoop);
}



const model = new Model();
const view = new View();
const controller = new Controller(model, view);

document.addEventListener("mousedown", (event) => { controller.onMouseDown(event); });
document.addEventListener("keydown", (event) => { controller.onKeyDown(event); });
document.addEventListener("keyup", (event) => { controller.onKeyUp(event); });

window.onresize = () => { view.setGameScale(); };
