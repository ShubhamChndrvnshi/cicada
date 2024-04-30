import { modInv } from "bigint-crypto-utils"

// 2^5 = 32
// log_2(32) = 5
// log_y(v * w^-1)= tally
// y ^ tally = v * w^-1

export function bruteForceDiscreteLog(u: bigint, v: bigint, y: bigint, N: bigint, T: bigint) {
    const w = sequentialSquarings(u, N, T)
    // const w = normalize(modPow(u, 2n ** T, N), N)
    const wInverse = modInv(w, N);
    const vwInv = (v * wInverse) % N
    console.log(`Brute forcing tally`)
    console.log(`\nw is ${w}`)

    let guess = 0n;

    // When tally is 0, or no one voted "YES"
    if (guess == vwInv) {
        return { w, tally: 0n };
    }

    for (let tally = 0n; tally < 2 ** 32; tally++) {
        // console.log("bruteForceDiscreteLog: ", { tally, guess: guess.toString() })
        guess = (y ** tally) % N;
        if (guess == vwInv) {
            return { w, tally };
        }
    }
    throw new Error('Discrete logarithm not found');
}

function sequentialSquarings(u: bigint, N: bigint, T: bigint) {
    let i = 0n
    let w = u;

    while (i !== T) {
        w = (w ** 2n) % N
        i += 1n;
    }
    // console.log({ w, i })
    return w
}



