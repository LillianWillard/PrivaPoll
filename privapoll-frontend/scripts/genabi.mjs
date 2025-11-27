import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "PrivaPoll";

// Output directory for ABI files
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const line =
  "\n===================================================================\n";

// Try multiple possible paths for different environments
// 1. Check if deployments are in current directory (Vercel build)
let deploymentsDir = path.resolve("./deployments");
if (!fs.existsSync(deploymentsDir)) {
  // 2. Try from fhevm-hardhat-template (local development)
  let rel = "../fhevm-hardhat-template";
  if (!fs.existsSync(path.resolve(rel))) {
    // 3. Try from root (monorepo setups)
    rel = "../../fhevm-hardhat-template";
  }
  if (!fs.existsSync(path.resolve(rel))) {
    // 4. Try absolute from current working directory
    const cwd = process.cwd();
    if (cwd.includes("privapoll-frontend")) {
      rel = path.join(cwd, "..", "fhevm-hardhat-template");
    }
  }
  const dir = path.resolve(rel);
  if (fs.existsSync(dir)) {
    deploymentsDir = path.join(dir, "deployments");
  } else {
    console.error(
      `${line}Unable to locate deployments directory. Tried:\n- ./deployments\n- ${rel}/deployments${line}`
    );
    process.exit(1);
  }
}

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Skip auto-deploy in CI/Vercel environments
    if (process.env.VERCEL || process.env.CI) {
      // In production/CI, localhost deployment is not needed
      return undefined;
    }
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(
    path.join(chainDeploymentDir, `${contractName}.json`),
    "utf-8"
  );

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Auto deployed on Linux/Mac (will fail on windows)
// In Vercel/production, localhost may not exist, so make it optional
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true /* optional */);

// Sepolia is required for production
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);
if (!deploySepolia && deployLocalhost) {
  deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
} else if (!deploySepolia && !deployLocalhost) {
  console.error(`${line}No deployments found. Please deploy to Sepolia first.${line}`);
  process.exit(1);
}

// Use Sepolia ABI as primary, fallback to localhost if available
const primaryABI = deploySepolia ? deploySepolia.abi : (deployLocalhost ? deployLocalhost.abi : null);
if (!primaryABI) {
  console.error(`${line}No ABI found in deployments.${line}`);
  process.exit(1);
}

if (deployLocalhost && deploySepolia) {
  if (
    JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
  ) {
    console.error(
      `${line}Deployments on localhost and Sepolia differ. Can't use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
    );
    process.exit(1);
  }
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: primaryABI }, null, 2)} as const;
\n`;

const localhostAddress = deployLocalhost ? deployLocalhost.address : "0x0000000000000000000000000000000000000000";
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${localhostAddress}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

