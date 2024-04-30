import { task } from "hardhat/config";
import { PrivateVote, CicadaVote } from '../typechain-types/PrivateVote';
import { bruteForceDiscreteLog, fromUint1024, recentlyCreatedId, hashPublicParam, normalize, toUint1024 } from "../utils";
import { checkPrimeSync } from "node:crypto"
import colors from "colors";
import { EthersError } from "ethers"
import { modPow } from "bigint-crypto-utils"

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

            // const { u, v } = vote.tally;
            const u = fromUint1024(vote.tally.u)
            const v = fromUint1024(vote.tally.v)

            const pp = await hre.run("get-cicada-pp", {
                id: id
            }) as CicadaVote.PublicParametersStruct

            const N = fromUint1024(pp.N)
            const T = BigInt(pp.T)
            const g = fromUint1024(pp.g)
            const h = fromUint1024(pp.h)
            const y = fromUint1024(pp.y)
            const yInv = fromUint1024(pp.yInv)

            const assumedFinalTally = 5n;

            // const w = normalize(modPow(u, 2n ** T, N), N)

            // const zz = new Puzzle({ secret: 21n, T: 10000n })
            // console.log({ s: zz.solve() })

            // const zz1 = new Puzzle({ u, v, params: { N, T, g, h, y, yInv } })
            // console.log({ s1: zz1.solve() })

            // const tally = assumedFinalTally
            const { w, tally } = bruteForceDiscreteLog(u, v, y, N, T)

            console.log(`Final decrypted tally: ${tally.toString()}`)

            console.log(`\nw : ${w.toString()}`)
            return

            // console.log(`\nGenerating Proof of exponentitation`)

            // Below mimics solidity contract
            // You can find relevant sol code at src/cicada/CicadaVote.sol in _verifyExponentiation(). 
            const HIGH_BIT = 2n ** 255n
            let j = 0;
            let l: bigint = 0n;
            console.log(colors.blue(`\nTrying to find j, such that when solidity keccak hash of u,w,pp & j typecasted to uint results in a prime i.e, l`))
            while (true) {
                const hash = BigInt(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                    ['uint256[4]', 'uint256[4]', 'bytes32', 'uint256'],
                    [toUint1024(u), toUint1024(w), hashPublicParam(pp), j]
                )))
                const candidate = hash | HIGH_BIT
                if (checkPrimeSync(candidate)) {
                    l = candidate
                    break
                }
                j++;
            }
            console.log(`\nPrime is: ${l.toString()}`)

            const q = (2n ** BigInt(pp.T)) / l
            const pi = normalize(modPow(u, q, N), N)
            const PoE: CicadaVote.ProofOfExponentiationStruct = {
                l,
                pi: toUint1024(pi),
                j
            }
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