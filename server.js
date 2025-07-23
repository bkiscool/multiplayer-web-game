const express = require('express')
var path = require('node:path');
const app = express()
const port = 3000

app.use(express.static(path.join(__dirname)));
app.use(express.json());

const players = new Array();

app.get('/', (request, response) => {
    response.sendFile("index.html");
});

app.post('/api/player-join', (req, res) => {
    const request = req.body;

    //console.log("/api/player-join: " + JSON.stringify(request));

    if (!players.includes(request.playername))
    {
        players.push(request.playername);
    }

    const response = {
        players: players
    };

    res.send(response);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


