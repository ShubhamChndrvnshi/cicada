import { CicadaVote } from '../typechain-types/CicadaVote';
import { normalize, generateRandomBigInt, fromUint1024, toUint1024 } from "./"
import { ethers } from 'ethers';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { modPow} from "bigint-crypto-utils"

const maxUint = ethers.MaxUint256;

export function generateVoteProof(pp: CicadaVote.PublicParametersStruct, vote: boolean, user: HardhatEthersSigner) {
    while (true) {
        const N = fromUint1024(pp.N)
        const g = fromUint1024(pp.g)
        const h = fromUint1024(pp.h)
        const y = fromUint1024(pp.y)
        const yInv = fromUint1024(pp.yInv)

        const r = generateRandomBigInt(BigInt(0), maxUint)
        const s = vote ? BigInt(1) : BigInt(0);

        const u = normalize(modPow(g, r, N), N)
        const v = normalize(modPow(h, r, N) * modPow(y, s, N) % N, N)

        if (vote) {
            let { a: a0, b: b0, c: c0, t: t0 } = simulator(N, g, h, u, v, r, undefined)
            const r1 = generateRandomBigInt(BigInt(0), maxUint)
            const a1 = normalize(modPow(g, r1, N), N)
            const b1 = normalize(modPow(h, r1, N), N)
            const c = BigInt(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint256[4]', 'uint256[4]', 'uint256[4]', 'uint256[4]', 'bytes32'],
                [toUint1024(a0), toUint1024(b0), toUint1024(a1), toUint1024(b1), hashPublicParam(pp, user)])))
            const c1 = (c - c0) % (maxUint + BigInt(1))
            const t1 = r1 + c1 * r
            if (c0 < BigInt(0) || c1 < BigInt(0)) continue
            return {
                'u': toUint1024(u), 'v': toUint1024(v),
                'a0': toUint1024(a0), 'b0': toUint1024(b0), 'c0': c0, 't0': toUint1024(t0),
                'a1': toUint1024(a1), 'b1': toUint1024(b1), 'c1': c1, 't1': toUint1024(t1)
            }
        } else {
            let { a: a1, b: b1, c: c1, t: t1 } = simulator(N, g, h, u, v, r, yInv)
            const r0 = generateRandomBigInt(BigInt(0), maxUint)
            const a0 = normalize(modPow(g, r0, N), N)
            const b0 = normalize(modPow(h, r0, N), N)
            const c = BigInt(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint256[4]', 'uint256[4]', 'uint256[4]', 'uint256[4]', 'bytes32'],
                [toUint1024(a0), toUint1024(b0), toUint1024(a1), toUint1024(b1), hashPublicParam(pp, user)])))
            const c0 = (c - c1) % (maxUint + BigInt(1))
            const t0 = r0 + c0 * r
            if (c0 < BigInt(0) || c1 < BigInt(0)) continue
            return {
                'u': toUint1024(u), 'v': toUint1024(v),
                'a0': toUint1024(a0), 'b0': toUint1024(b0), 'c0': c0, 't0': toUint1024(t0),
                'a1': toUint1024(a1), 'b1': toUint1024(b1), 'c1': c1, 't1': toUint1024(t1)
            }
        }
    }
}

export function hashPublicParam(pp: CicadaVote.PublicParametersStruct, user?: HardhatEthersSigner) {
    const hash = ethers.solidityPackedKeccak256(
        [
            'uint256[4]', // N
            'uint256',    // T
            'uint256[4]', // g
            'uint256[4]', // h
            'uint256[4]', // y
            'uint256[4]'],
        [pp.N,
        pp.T,
        pp.g,
        pp.h,
        pp.y,
        pp.yInv]
    )
    if (!user) return hash;
    return ethers.solidityPackedKeccak256(
        ['bytes32', 'bytes32'],
        [hash, ethers.zeroPadValue(user.address, 32)])
}

function simulator(N: bigint, g: bigint, h: bigint, u: bigint, v: bigint, r: bigint, yInverse: undefined | bigint) {
    let yInv = BigInt(1)
    if (yInverse) yInv = yInverse
    const c = generateRandomBigInt(BigInt(0), maxUint)
    const t = generateRandomBigInt(BigInt(0), maxUint) + r * c
    const a = normalize(modPow(g, t, N) * modPow(u, -c, N) % N, N)
    const b = normalize((modPow(h, t, N) * modPow(v * yInv, -c, N)) % N, N)
    return { a, b, c, t }
}