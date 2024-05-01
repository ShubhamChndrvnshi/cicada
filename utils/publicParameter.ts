import { pki } from 'node-forge';
import { CicadaVote } from '../typechain-types/CicadaVote';
import { normalize, generateRandomBigInt, toUint1024, jacobi } from "./"
import { modPow } from 'bigint-crypto-utils';
import { readFileSync, existsSync } from "fs"

export function generatePublicParameters(lockTimeInSeconds?: number): CicadaVote.PublicParametersStruct {
    while (true) {
        const rsa = pki.rsa;
        const keypair = rsa.generateKeyPair({ bits: 1024 });

        const N = BigInt(keypair.publicKey.n.toString());

        const T = generateRandomBigInt(1000n, 100000n)
        const g = normalize(generateRandomBigInt(BigInt(0), N), N);
        const h = normalize(modPow(g, BigInt(2) ** BigInt(T), N), N)

        const y = normalize(generateRandomBigInt(BigInt(0), N), N);
        const yInv = normalize(modPow(y, -1n,N), N);
        const jacobiG = jacobi(g, N)
        const jacobiY = jacobi(y, N)

        if (!((((y * yInv) % N) == BigInt(1))) || jacobiG !== 1 || jacobiY !== 1) continue

        return {
            N: toUint1024(N),
            T: T,
            g: toUint1024(g),
            h: toUint1024(h),
            y: toUint1024(y),
            yInv: toUint1024(yInv),
        }
    }
}

export function readPublicParam(){
    if(!existsSync('pp.json')) throw Error("Public param not generated or pp.json not present");

    const ppRaw = readFileSync('pp.json','utf-8')
    return JSON.parse(ppRaw) as CicadaVote.PublicParametersStruct 
}