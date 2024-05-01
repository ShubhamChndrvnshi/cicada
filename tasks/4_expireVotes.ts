import { task } from "hardhat/config";
import colors from "colors";
import { PrivateVote } from '../typechain-types/PrivateVote';
import { mine } from "@nomicfoundation/hardhat-network-helpers";

// npx hardhat expire-votes --network localhost
task("expire-votes", "Increase local evm's time to expire market")
    .setAction(
        async (args, hre) => {
            const ethers = hre.ethers;


            const blockTimestamp = Number((await ethers.provider.getBlock('latest'))?.timestamp);
            let blockTimeToMine = BigInt(blockTimestamp)


            const cicadaPrivateVoteInstance: PrivateVote = await ethers.getContract("PrivateVote");

            const allVoteCreatedEvent = await cicadaPrivateVoteInstance.queryFilter(cicadaPrivateVoteInstance.filters.VoteCreated)

            for (let i = 0; i < allVoteCreatedEvent.length; i++) {
                const id = allVoteCreatedEvent[i].args[0]

                const vote = await cicadaPrivateVoteInstance.votes(id)

                const isFinalized = vote.isFinalized
                const voteExpiry = vote.endTime


                if (!isFinalized && voteExpiry > blockTimeToMine) {
                    blockTimeToMine = voteExpiry
                }
            }
            try {
                const evmSecsToBeIncreamented = blockTimeToMine - BigInt(blockTimestamp) + 1n;
                await mine(evmSecsToBeIncreamented);

                // sending a txn for new block to be mined with increased time
                const [owner] = await ethers.getSigners();
                await owner.sendTransaction({
                    to: ethers.ZeroAddress,
                    value: ethers.parseEther("0.000001"),
                });

                console.log(colors.green(`EVM time increased by ${evmSecsToBeIncreamented} seconds`));
            } catch (error) {
                console.log(colors.red(`Failed to increase evm time`));
                console.log(error);
            }
        }
    );