import { task } from "hardhat/config";
import { PrivateVote, CicadaVote } from '../typechain-types/PrivateVote';
import { bruteForceDiscreteLog, fromUint1024, recentlyCreatedId, toUint1024, findOmegaBysequentialSquarings, getPoE } from "../utils";
import colors from "colors";
import { EthersError } from "ethers"

// npx hardhat finalize-vote --id 1 --network localhost
task("finalize-vote", "New cicada vote instance")
    .addOptionalParam("id", "Voting istance id")
    .setAction(
        async (args, hre) => {
            const ethers = hre.ethers

            const [deployerSigner] = await ethers.getSigners()

            const cicada: PrivateVote = await hre.ethers.getContract('PrivateVote', deployerSigner);

            const id = (args.id | recentlyCreatedId()).toString();

            const vote = await cicada.votes(id)

            const isFinalized = vote.isFinalized
            if (isFinalized) throw new Error("Already finalised")

            const pp = await hre.run("get-cicada-public-param", {
                id: id
            }) as CicadaVote.PublicParametersStruct

            const u = fromUint1024(vote.tally.u)
            const v = fromUint1024(vote.tally.v)
            const N = fromUint1024(pp.N)
            const T = BigInt(pp.T)
            const y = fromUint1024(pp.y)


            console.log(`Starting brute force`)

            // Step 1
            const w = findOmegaBysequentialSquarings(u, N, T)

            // Step 2
            const tally = bruteForceDiscreteLog(w, u, v, y, N, T)

            console.log(`Final decrypted tally: ${tally.toString()}`)

            // Step 3
            const PoE: CicadaVote.ProofOfExponentiationStruct = getPoE(u ,w, pp)
            console.log(colors.green(`\nProof of exponentitation: `), PoE)

            try {
                console.log(colors.blue(`\n==> Now finalizing vote`))
                const tx = await cicada.finalizeVote(Number(id), pp, tally, toUint1024(w), PoE)
                await tx.wait()
                console.log(colors.bgGreen(`\n==>Vote finalized`))
            } catch (err: unknown) {
                const knownError = err as EthersError;
                console.log(colors.red(`Failed to finalize vote: ${knownError.message}`))
            }
        }
    );