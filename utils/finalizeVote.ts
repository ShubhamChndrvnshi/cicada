import { modInv, modPow } from "bigint-crypto-utils"
import colors from "colors";
import { checkPrimeSync } from "node:crypto"
import { CicadaVote } from '../typechain-types/PrivateVote';

import { ethers } from "ethers"
import { fromUint1024, normalize, toUint1024 } from "./helpers";
import { hashPublicParam } from "./voteProofGenHelper";

// Step 1
export function findOmegaBysequentialSquarings(u: bigint, N: bigint, T: bigint) {
    let i = 0n
    let w = u;

    while (i !== T) {
        w = normalize((w ** 2n) % N, N)
        i += 1n;
    }
    return w
}

// Step 2
export function bruteForceDiscreteLog(w: bigint, u: bigint, v: bigint, y: bigint, N: bigint, T: bigint) {
    const wInverse = normalize(modInv(w, N), N);
    const vwInv = normalize((v * wInverse) % N, N)

    console.log(`Brute forcing tally`)

    let guess = 0n;
    let tally = 0n

    // When tally is 0, or no one voted "YES"
    if (guess == vwInv) return tally;

    // log_y(v * w^-1)= tally
    // y ^ tally = v * w^-1
    while (tally < 2 ** 32) {

        guess = normalize((y ** tally) % N, N);

        if (guess == vwInv) return tally
        tally++;
    }
    throw new Error('Discrete logarithm not found');
}

// Step 3
export function getPoE(u: bigint, w: bigint, pp: CicadaVote.PublicParametersStruct) {
    const HIGH_BIT = 2n ** 255n
    let j = 0;
    let l: bigint = 0n;
    console.log(`\nGenerating Proof of exponentitation`)
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

    const N = fromUint1024(pp.N)
    const q = (2n ** BigInt(pp.T)) / l
    const pi = normalize(modPow(u, q, N), N)
    const PoE: CicadaVote.ProofOfExponentiationStruct = {
        l,
        pi: toUint1024(pi),
        j
    }
    return PoE
}