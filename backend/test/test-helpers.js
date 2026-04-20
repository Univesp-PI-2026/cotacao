const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

async function createTestServer(createApp) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  };
}

function createToken() {
  return jwt.sign({ sub: 1, role: "admin" }, process.env.JWT_SECRET);
}

async function requestJson(server, path, options = {}) {
  const response = await fetch(`${server.baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

function buildJsonRequest(body, options = {}) {
  const headers = {
    authorization: `Bearer ${createToken()}`,
    "content-type": "application/json",
    ...(options.headers || {})
  };

  return {
    ...options,
    headers,
    body: JSON.stringify(body)
  };
}

function buildAuthedRequest(options = {}) {
  return {
    ...options,
    headers: {
      authorization: `Bearer ${createToken()}`,
      ...(options.headers || {})
    }
  };
}

module.exports = {
  buildAuthedRequest,
  buildJsonRequest,
  createTestServer,
  requestJson
};
