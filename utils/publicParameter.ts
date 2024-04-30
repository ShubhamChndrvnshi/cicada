import { pki } from 'node-forge';
import { CicadaVote } from '../typechain-types/CicadaVote';
import { normalize, generateRandomBigInt, toUint1024, jacobi } from "./"
import { modPow, modInv } from 'bigint-crypto-utils';
import { readFileSync, existsSync } from "fs"

export function generatePublicParameters(lockTimeInSeconds?: number): CicadaVote.PublicParametersStruct {
    while (true) {
        const rsa = pki.rsa;
        const keypair = rsa.generateKeyPair({ bits: 1024 });

        const N = BigInt(keypair.publicKey.n.toString());

        const T = 100000n

        // const T = generateRandomBigInt(BigInt(1000), BigInt(100000))
        const g = normalize(generateRandomBigInt(BigInt(0), N), N);
        const h = normalize(modPow(g, BigInt(2) ** BigInt(T), N), N)

        const y = normalize(generateRandomBigInt(BigInt(0), N), N);
        const yInv = normalize(modInv(y, N), N);

        if (!((((y * yInv) % N) == BigInt(1)))) continue
        const jacobiG = jacobi(g, N)
        const jacobiY = jacobi(y, N)
        console.log({
            jacobiG, jacobiY
        })

        if (jacobiG !== 1) continue
        if (jacobiY !== 1) continue

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