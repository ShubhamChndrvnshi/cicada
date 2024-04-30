import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    await deploy("PrivateVote",
        {
            from: deployer,
            args: [],
            log: true,
            skipIfAlreadyDeployed: true
        }
    );
};

func.tags = ["PrivateVote"]
export default func;