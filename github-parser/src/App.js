import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [repositories, setRepositories] = useState([]);
  const [dependencies, setDependencies] = useState([]);

  const authenticateWithGithub = () => {
    console.log("Authenticating with GitHub...");
    window.location.href = "http://localhost:5000/authenticate";
  };

  const getRepositories = useCallback(async () => {
    try {
      console.log("Fetching repositories...");
      const response = await axios.get(
        `http://localhost:5000/repositories/?accessToekn=${accessToken}`
      );
      console.log("Repositories response:", response.data);
      setRepositories(response.data);
    } catch (error) {
      console.error("Failed to retrieve repositories", error);
    }
  }, [accessToken]);

  useEffect(() => {
    console.log("Inside useEffect");
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    console.log("URL Parameters:", params);

    if (params.code && !accessToken) {
      console.log("Authorization code present:", params.code);
      setAccessToken(params.code);
    }
    getRepositories();
  }, [accessToken]);

  const getDependencies = async (repoName) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/dependencies/${repoName}/${accessToken}`
      );
      setDependencies(response.data);
    } catch (error) {
      console.error("Failed to retrieve dependencies", error);
    }
  };

  return (
    <div>
      <h1>GitHub Repo Dependencies Parser</h1>
      {accessToken ? (
        <>
          <button onClick={getRepositories}>Get Repositories</button>
          <div>
            <h2>Repositories:</h2>
            <ul>
              {repositories.map((repo) => (
                <li key={repo.id}>
                  {repo.full_name}{" "}
                  <button onClick={() => getDependencies(repo.full_name)}>
                    Get Dependencies
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Dependencies:</h2>
            <ul>
              {dependencies.map((dependency, index) => (
                <li key={index}>{dependency}</li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <button onClick={authenticateWithGithub}>
          Authenticate with GitHub
        </button>
      )}
    </div>
  );
}

export default App;
