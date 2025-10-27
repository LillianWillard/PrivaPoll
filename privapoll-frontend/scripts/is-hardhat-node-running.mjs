import http from "http";

const HARDHAT_NODE_URL = "http://127.0.0.1:8545";

function checkHardhatNode() {
  return new Promise((resolve) => {
    const req = http.request(
      HARDHAT_NODE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      }
    );

    req.on("error", () => {
      resolve(false);
    });

    req.write(JSON.stringify({
      jsonrpc: "2.0",
      method: "net_version",
      params: [],
      id: 1,
    }));

    req.end();
  });
}

const isRunning = await checkHardhatNode();

if (!isRunning) {
  console.error(`
===================================================================
ERROR: Hardhat Node is not running!

Please start the Hardhat Node before running 'npm run dev:mock':

Terminal 1:
  cd ../fhevm-hardhat-template
  npx hardhat node

Terminal 2:
  npm run dev:mock
===================================================================
  `);
  process.exit(1);
}

console.log("✅ Hardhat Node is running at", HARDHAT_NODE_URL);

