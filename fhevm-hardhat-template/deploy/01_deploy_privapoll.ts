import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying PrivaPoll contract...");

  const deployment = await deploy("PrivaPoll", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`✅ PrivaPoll deployed at: ${deployment.address}`);
};

export default func;
func.tags = ["PrivaPoll"];
func.id = "deploy_privapoll";

