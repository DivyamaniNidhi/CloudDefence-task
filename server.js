const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { parseString } = require("xml2js"); //for parsing XML data into JavaScript objects

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: "http://localhost:5000", // Allow requests only from this origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

//GitHub Oauth App Credentials
const CLIENT_ID = "8f01c8b1a146d44974d7";
const CLIENT_SECRET = "c530792cc4f7fe768b4933b4fd8033ecb5c8e317";
const REDIRECT_URI = "http://localhost:3000/repositories";

// GitHub Authentication callback
app.get("/authenticate", (req, res) => {
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`
  );
});

app.get("/repositories", async (req, res) => {
  console.log("Callback endpoint called");
  const code = req.query.code;
  console.log("Authorization code:", code);

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("Access Token:", accessToken);

    // You might want to fetch the user ID here and redirect to a new endpoint
    // For example, fetch the user details
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userId = userResponse.data.login;

    // Redirect to the user's repository page
    res.redirect(
      `http://localhost:3000/user-repositories/${userId}?accessToken=${accessToken}`
    );
  } catch (error) {
    console.error(
      "Error exchanging code for access token:",
      error.response.data
    );
    res.status(500).json({ error: "Failed to authenticate with GitHub" });
  }
});

// Retrieve All Repositories list
app.get("/repositories/:accessToken", async (req, res) => {
  const accessToken = req.params.accessToken;
  try {
    const repositoriesResponse = await axios.get(
      "https://api.github.com/user/repos",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    res.json(repositoriesResponse.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve repositories" });
  }
});

// Parse POM.XML files and print dependencies
app.get("/dependencies/:repoName/:accessToken", async (req, res) => {
  const { repoName, accessToken } = req.params;
  try {
    const contentsResponse = await axios.get(
      `https://api.github.com/repos/${repoName}/contents`
    );
    const pomFiles = contentsResponse.data.filter(
      (file) => file.name.toLowerCase() === "pom.xml"
    );

    const dependenciesList = [];

    for (const pomFile of pomFiles) {
      const pomContentResponse = await axios.get(pomFile.download_url);
      const xmlContent = pomContentResponse.data;

      parseString(xmlContent, (err, result) => {
        if (err) {
          console.error(err);
        } else {
          const dependencies = result.project.dependencies[0].dependency;
          dependencies.forEach((dependency) => {
            const groupId = dependency.groupId[0];
            const artifactId = dependency.artifactId[0];
            const version = dependency.version[0];
            dependenciesList.push(`${groupId}: Version ${version}`);
          });
        }
      });
    }

    res.json(dependenciesList);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve dependencies" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
