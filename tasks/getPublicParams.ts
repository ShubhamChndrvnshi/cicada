import { task } from "hardhat/config";
import { PrivateVote } from '../../typechain-types/src/PrivateVote';
import { CicadaVote } from '../../typechain-types/src/cicada/CicadaVote';

// npx hardhat get-cicada-pp --id "vote id" --network localhost
task("get-cicada-pp", "Get public parameter of cicada vote instance")
    .addParam("id", "instance id")
    .setAction(
        async (args, hre) => {
            const ethers = hre.ethers

            const [deployerSigner] = await ethers.getSigners()

            const cicada: PrivateVote = await hre.ethers.getContract('PrivateVote', deployerSigner);

            const allVoteCreatedEvent = await cicada.queryFilter(cicada.filters.VoteCreated)

            const voteCreatedEvent = allVoteCreatedEvent.filter(event => event.args[0] == BigInt(args.id))[0]
            if (!voteCreatedEvent) throw new Error("No vote created with given id")
            const pp: CicadaVote.PublicParametersStruct = {
                N: [...voteCreatedEvent.args[4][0]],
                T: voteCreatedEvent.args[4][1],
                g: [...voteCreatedEvent.args[4][2]],
                h: [...voteCreatedEvent.args[4][3]],
                y: [...voteCreatedEvent.args[4][4]],
                yInv: [...voteCreatedEvent.args[4][5]]
            }
            // const pp = {
            //     N: fromUint1024([...voteCreatedEvent.args[4][0]]).toString(),
            //     T: voteCreatedEvent.args[4][1].toString(),
            //     g: fromUint1024([...voteCreatedEvent.args[4][2]]).toString(),
            //     h: fromUint1024([...voteCreatedEvent.args[4][3]]).toString(),
            //     y: fromUint1024([...voteCreatedEvent.args[4][4]]).toString(),
            //     yInv: fromUint1024([...voteCreatedEvent.args[4][5]]).toString()
            // }
            // console.log(pp)
            return pp
        }
    );