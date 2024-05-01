import { ethers } from 'ethers'
import { readFileSync } from "fs"
import * as crypto from 'crypto';
import { assert } from 'ethers';
import { parse } from 'csv-parse';

/*  Helper functions for generatePublicParameters() */
export function toUint1024(x: bigint): [bigint, bigint, bigint, bigint] {
    let binaryString: string;

    if (x >= 0n) {
        // For non-negative integers, pad with zeros
        binaryString = x.toString(2).padStart(1024, '0');
    } else {
        // For negative integers, convert to two's complement
        const invertedBits = (~x).toString(2).padStart(1023, '0'); // Invert bits and pad to 1023 bits
        const twoComplement = (BigInt('0b' + invertedBits) + 1n).toString(2).padStart(1024, '0'); // Add 1 and pad to 1024 bits
        binaryString = twoComplement;
    }

    const parts: string[] = [binaryString.slice(0, 256), binaryString.slice(256, 512),
    binaryString.slice(512, 768), binaryString.slice(768)];
    return parts.map(part => BigInt(`0b${part}`)) as [bigint, bigint, bigint, bigint];
}

export function fromUint1024(parts: [ethers.BigNumberish, ethers.BigNumberish, ethers.BigNumberish, ethers.BigNumberish]): bigint {
    const binaryString = parts.map(part => part.toString(2).padStart(256, '0')).join('');
    return BigInt(`0b${binaryString}`);
}

// verified with solidity impl
export function normalize(x: bigint, N: bigint): bigint {
    const negX = N - x;
    if (negX < x) return negX
    return x
}

export function generateRandomBigInt(min: bigint, max: bigint) {
    const range = max - min;
    const byteSize = Math.ceil(Math.log2(Number(range)) / 8);
    let rndBigInt: bigint;
    do {
        const rndBytes = crypto.randomBytes(byteSize);
        rndBigInt = BigInt('0x' + rndBytes.toString('hex'));
    } while (rndBigInt > range);
    return min + rndBigInt;
}

// implementation derived from https://en.wikipedia.org/wiki/Jacobi_symbol
export function jacobi(a: bigint, n: bigint): number {
    assert(n > 0n && n % 2n === 1n, "Assertion failed", 'UNEXPECTED_ARGUMENT')
    // Step 1
    a = a % n;
    let t: number = 1;
    let r: bigint;

    // Step 3
    while (a !== 0n) {
        // Step 2
        while (a % 2n === 0n) {
            a /= 2n;
            r = n % 8n;
            if (r === 3n || r === 5n) {
                t = -t;
            }
        }
        // Step 4
        r = n;
        n = a;
        a = r;
        if (a % 4n === 3n && n % 4n === 3n) {
            t = -t;
        }
        a = a % n;
    }
    if (n === 1n) {
        return t;
    } else {
        return 0;
    }
}

export function csvToJson(filePath: string): any {
    // Read the CSV file content
    const csvData = readFileSync(filePath, { encoding: 'utf-8' });

    return new Promise((resolve, reject) => {
        // Parse the CSV data
        parse(csvData, {
            columns: true, // Parse headers to object keys
            skip_empty_lines: true,
        }, (err, records) => {
            if (err) reject(err);
            else resolve(records);
        });
    });

}

export function recentlyCreatedId() {
    return parseInt(readFileSync("id", "utf8"))
}

export function waitFor<T>(p: Promise<{ wait: () => Promise<T> }>): Promise<T> {
    return p.then((tx) => tx.wait());
}

export const formatMilSeconds = (mseconds: number) => formatSeconds(mseconds / 1000)
export function formatSeconds(seconds: number): string {
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;

    let years = Math.floor(seconds / year);
    seconds %= year;
    let months = Math.floor(seconds / month);
    seconds %= month;
    let days = Math.floor(seconds / day);
    seconds %= day;
    let hours = Math.floor(seconds / hour);
    seconds %= hour;
    let minutes = Math.floor(seconds / minute);
    seconds %= minute;

    let result: string[] = [];
    if (years) {
        result.push(`${years} year${years > 1 ? 's' : ''}`);
    }
    if (months) {
        result.push(`${months} month${months > 1 ? 's' : ''}`);
    }
    if (days) {
        result.push(`${days} day${days > 1 ? 's' : ''}`);
    }
    if (hours) {
        result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    }
    if (minutes) {
        result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }
    if (seconds) {
        result.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }

    return result.join(', ') || '0 seconds';
}