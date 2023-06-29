const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
//GET list of all states
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
        SELECT
          state_id as stateId,
          state_name as stateName,
          population as population
        FROM
          state;`;
  const statesArray = await db.all(getAllStatesQuery);
  response.send(statesArray);
});

//API 2
//GET a particular state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getParticularStateQuery = `
        SELECT
          state_id as stateId,
          state_name as stateName,
          population as population
        FROM
          state
        WHERE
          state_id = ${stateId};`;
  const particularState = await db.get(getParticularStateQuery);
  response.send(particularState);
});

//API 3
//Add district API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
        INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
        VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//GET all district Information
app.get("/districts/", async (request, response) => {
  const getDistrictsQuery = `
        SELECT
          *
        FROM
          district`;
  const districtInfoArray = await db.all(getDistrictsQuery);
  response.send(districtInfoArray);
});

//API 4
//GET particular district with districtId
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT
          district_id as districtId,
          district_name as districtName,
          state_id as stateId,
          cases as cases,
          cured as cured,
          active as active,
          deaths as deaths
        FROM
          district
        WHERE
          district_id = ${districtId};`;
  const aParticularDistrict = await db.get(getDistrictQuery);
  response.send(aParticularDistrict);
});

//API 5
//DELETE a particular district with districtId
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district WHERE district_id = ?;`;
  await db.run(deleteDistrictQuery, [districtId]);
  response.send("District Removed");
});

//API 6
//UPDATE details of specific district based on district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetailsQuery = `
        UPDATE district
        SET 
          district_name = '${districtName}',
          state_id = ${stateId},
          cases = ${cases},
          cured = ${cured},
          active = ${active},
          deaths = ${deaths}
        WHERE 
          district_id = ${districtId};`;
  await db.run(updateDistrictDetailsQuery);
  response.send("District Details Updated");
});

//API 7
//GET statistics of total cases, active, deaths of specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT
            SUM(cases) as totalCases,
            SUM(cured) as totalCured,
            SUM(active) as totalActive,
            SUM(deaths) as totalDeaths
        FROM
            district
        WHERE
            state_id = ${stateId};`;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

//API 8
//GET object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameOfDistrictQuery = `
        SELECT
            state.state_name as stateName
        FROM
            state INNER JOIN district ON state.state_id = district.state_id
        WHERE
            district.district_id = ${districtId};`;
  const result = db.run(getStateNameOfDistrictQuery);
  response.send(result);
});

module.exports = app;
