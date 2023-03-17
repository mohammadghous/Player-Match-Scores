const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

app.use(express.json());

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

let db = null;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Get All Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Get a Player details API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId}
    `;
  const player = await db.get(getPlayerDetailsQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//Put District API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name = '${playerName}'
    WHERE player_id = ${playerId}
      `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get a Match details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId}
    `;
  const match = await db.get(getMatchDetailsQuery);
  response.send(convertDbObjectToResponseObject1(match));
});

//
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerNameQuery = `
  SELECT * FROM player_match_score NATURAL JOIN player_details
  WHERE match_id = ${matchId}
  `;
  const playersArray = await db.all(getPlayerNameQuery);
  console.log(playersArray);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_id = ${playerId}
    `;
  const matchArray = await db.all(getPlayerMatchesQuery);
  response.send(
    matchArray.map((eachPlayer) => convertDbObjectToResponseObject1(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
  SELECT player_id, player_name, SUM(score), SUM(fours), SUM(sixes) 
  FROM player_match_score NATURAL JOIN player_details
  WHERE player_id = ${playerId}
  `;
  const statistics = await db.get(getPlayerNameQuery);
  //console.log(statistics);
  response.send({
    playerId: statistics["player_id"],
    playerName: statistics["player_name"],
    totalScore: statistics["SUM(score)"],
    totalFours: statistics["SUM(fours)"],
    totalSixes: statistics["SUM(sixes)"],
  });
});

module.exports = app;
