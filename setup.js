const axios = require("axios").default;
const MEROXA_AUTH_TOKEN = process.env.MEROXA_AUTH_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
console.log(DATABASE_URL);

function toCredentials(url) {
  const hasProtocol = url.indexOf("://") !== -1;

  if (!hasProtocol) {
    return {
      validUrl: url,
    };
  }

  const hasCredentialDelimiter = url.indexOf("@") !== -1;

  if (!hasCredentialDelimiter) {
    return {
      validUrl: url,
    };
  }

  const splitAtProtocol = url.split("://");
  const protocol = splitAtProtocol[0];

  const splitAtCredentials = splitAtProtocol[1].split("@");

  let hostAndRest, credentials;

  // account for @'s in passwords
  if (splitAtCredentials.length > 2) {
    hostAndRest = splitAtCredentials.pop();
    credentials = splitAtCredentials.join("@");
  } else {
    hostAndRest = splitAtCredentials[1];
    credentials = splitAtCredentials[0];
  }

  let [username, password] = credentials.split(":").map((cred) => {
    // account for blank strings
    return cred ? cred : undefined;
  });

  if (!username && !password) {
    return {
      validUrl: url,
    };
  }

  const hasPortDelimiter = hostAndRest.indexOf(":") !== -1;
  const splitAtPort = hostAndRest.split(":");
  const hasPort = hasPortDelimiter && splitAtPort.length === 2;
  let host, port, datastore, validUrl;

  if (hasPort) {
    host = splitAtPort[0];
    [, port, datastore] = splitAtPort[1].match(/(\d*)\/?(.*)/);
  } else {
    [, host, datastore] = splitAtPort[0].match(/([\w\.~_-]*)\/?(.*)/);
  }

  if (!host) {
    return {
      validUrl: url,
    };
  }

  validUrl = `${protocol}://${host}`;

  if (port) {
    validUrl = `${validUrl}:${port}`;
  }

  if (datastore) {
    validUrl = `${validUrl}/${datastore}`;
  }

  return {
    username,
    password,
    host,
    port,
    datastore,
    protocol,
    validUrl,
  };
}

function serializeCredentialData(url) {
  let { username, password, validUrl } = toCredentials(url);

  const credentialsData = Object.assign({ username, password }, credentials);

  return {
    credentials: credentialsData,
    url: validUrl,
  };
}

// --------------------------------------------------------------------------------

const api = axios.create({
  baseURL: "https://api.meroxa.io/v1",
  timeout: 1000,
  headers: { Authorization: MEROXA_AUTH_TOKEN },
});

const { url, credentials } = serializeCredentialData(DATABASE_URL);

async function createResource() {
  await api.post("/resources", {
    name: "Heroku PG",
    type: "postgres",
    metadata: {
      "mx:description": "",
      "mx:color": "#3E93DD",
      "mx:symbol": "PG",
      "mx:ssl": "true",
      logical_replication: "true",
    },
    ssh_tunnel: {
      address: "",
      "public-key": "",
    },
    url,
    credentials,
  });
}

console.log(DATABASE_URL);

createResource();
