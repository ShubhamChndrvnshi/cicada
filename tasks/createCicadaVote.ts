import { task } from "hardhat/config";
import { PrivateVote, CicadaVote } from '../typechain-types/PrivateVote';
import { formatSeconds, readPublicParam } from "../utils";
import colors from 'colors';
import { existsSync, writeFileSync, readFileSync } from "fs"

// npx hardhat create-vote --description "vote description/question" --expiry 'epoch timestamp' --network localhost
task("create-vote", "New cicada vote instance")
    .addParam("description", "Voting description or bts question")
    .addOptionalParam("expiry", "Voting expiry")
    .setAction(
        async (args, hre) => {
            const ethers = hre.ethers

            const [deployerSigner] = await ethers.getSigners()

            const cicada: PrivateVote = await hre.ethers.getContract('PrivateVote', deployerSigner);

            const expiry = Number(args.expiry) ? Number(args.expiry) : Math.floor(Date.now() / 1000 + 60 * 5)
            const secondsToExpiry = Math.round((expiry - (Date.now() / 1000)))
            console.log("life time : " + formatSeconds(secondsToExpiry));

            const pp = readPublicParam()


            const tx = await cicada.createVote(pp, args.description, 0, secondsToExpiry)
            const confirmedTx = await tx.wait()

            if (confirmedTx?.logs) {
                const voteCreatedEvent = cicada.interface.parseLog(confirmedTx.logs[0]);
                console.log(colors.green(`New voting option created with id: ${voteCreatedEvent?.args[0]}`))
                writeFileSync("id", `${voteCreatedEvent?.args[0]}`)
            } else console.log(colors.green("New voting created"))
        }
    );