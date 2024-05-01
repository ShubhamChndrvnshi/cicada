import { task, types } from "hardhat/config";
import { waitFor } from "../utils"
import { PrivateVote, CicadaVote } from '../typechain-types/PrivateVote';
import colors from "colors";
import { generateVoteProof } from '../utils';

// npx hardhat cast-ballot --vote "YES/NO" --id '1' --network localhost
task("cast-ballot", "Cast a private ballot")
    .addParam("id", "Voting istance id")
    .addParam("vote", "Bettor's vote", undefined, types.string)
    .addOptionalParam("bettor", "Address of bettor", undefined)
    .setAction(
        async (args, hre) => {
            if (!(args.vote == "YES" || args.vote == "NO")) {
                throw new Error(`Invalid value for vote: ${args.vote}. Only "YES" and "NO" are valid.`);
            }

            const bettor = args.bettor ? await hre.ethers.getSigner(args.bettor) : (await hre.ethers.getSigners())[0];

            const cicada: PrivateVote = await hre.ethers.getContract('PrivateVote', bettor);

            console.log(colors.blue(`Bettor ${bettor.address} vote ${args.vote}`))
            try {
                const vote = args.vote == "YES" ? true : false;

                const pp = await hre.run("get-cicada-public-param", {
                    id: args.id
                }) as CicadaVote.PublicParametersStruct


                const proofWithBallot = generateVoteProof(pp, vote, bettor)
                const ballot: CicadaVote.PuzzleStruct = {
                    u: proofWithBallot.u,
                    v: proofWithBallot.v
                }
                const proof: CicadaVote.ProofOfValidityStruct = {
                    a_0: proofWithBallot.a0,
                    b_0: proofWithBallot.b0,
                    t_0: proofWithBallot.t0,
                    c_0: proofWithBallot.c0,
                    a_1: proofWithBallot.a1,
                    b_1: proofWithBallot.b1,
                    t_1: proofWithBallot.t1,
                    c_1: proofWithBallot.c1,
                }
                console.log(colors.green(`==> Ballot Casting`));
                await waitFor(cicada.castBallot(Number(args.id), pp, ballot, proof))
                console.log(colors.green(`==> Ballot Casted`));
            } catch (error) {
                console.log(colors.red(`==> Ballot cast failed failed`));
                console.log(error);
            }
        }
    );