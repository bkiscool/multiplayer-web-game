const express = require('express');
const { STATUS_CODES } = require('node:http');
var path = require('node:path');
const { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } = require('obscenity');
const profanity_filter = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});
const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, "../client")));
app.use(express.json());

const TIMEOUT = 5;

const players = new Map(); // playername -> {x, y, timestamp}

app.get('/', (request, response) => {
    response.sendFile("index.html");
});

app.post('/api/player-update', (req, res) => {
    const request = req.body;

    //console.log("/api/player-join: " + JSON.stringify(request));

    if (!players.has(request.playername))
    {
        console.log("Got new player: " + request.playername);
    }

    const player_data = {
        x: request.x,
        y: request.y,
        timestamp: new Date().getTime()
    };
    players.set(request.playername, player_data);

    const response = {
        response: "Request successful"
    };

    res.json(response);
});

app.get('/api/players', (req, res) => {

    const updated_players = new Array();
    players.forEach((data, playername) => {
        const player = {
            playername: playername,
            x: data.x,
            y: data.y
        };
        updated_players.push(player);
    });

    const response = {
        players: updated_players
    };

    res.json(response);
});

app.post('/api/keepalive', (req, res) => {
    const request = req.body;
    const player_timestamp = Number(req.headers["timestamp"]);
    const now = new Date();
    const timestamp = now.getTime();

    //console.log("/api/player-join: " + JSON.stringify(request));

    const latency = timestamp - player_timestamp;
    //console.log("Received keepalive: "+ request.playername);
    //console.log("Latency: " + latency.toString() + "ms");

    if (players.has(request.playername))
    {
        const player_data = {
            x: request.x,
            y: request.y,
            timestamp: timestamp
        };
        players.set(request.playername, player_data);
    } else
    {
        console.log("Received keepalive before player update: " + request.playername);
        return;
    }

    const timedout = new Array();
    players.forEach((data, playername) => {
        if ((timestamp - data.timestamp) > (TIMEOUT * 1000))
        {
            console.log("Player is timedout (" + (timestamp - data.timestamp) / 1000 + "): " + playername);
            timedout.push(playername);
        }
    });

    timedout.forEach(playername => players.delete(playername));

    const response = {
        response: "Request successful"
    };

    res.json(response);
});

app.get('/api/connected-players', (req, res) => {

    const alive_players = new Array();
    players.forEach((data, playername) => {
        const player = {
            playername: playername,
            x: data.x,
            y: data.y
        };
        alive_players.push(player);
    });

    const response = {
        players: alive_players
    };

    res.json(response);
});

app.post('/api/profanity-check', (req, res) => {
    const request = req.body;
    const playername = request.playername;
    let response = new Object();

    if(profanity_filter.hasMatch(playername))
    {
        response = {
            hasProfanity: true
        };
    } else {
        response = {
            hasProfanity: false
        };
    }

    res.json(response);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


