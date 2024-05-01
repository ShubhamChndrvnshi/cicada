import { task } from "hardhat/config";
import { formatSeconds, generatePublicParameters } from "../utils";
import { writeFileSync } from "fs"

// npx hardhat generate-public-params --expiry 'epoch timestamp'
task("generate-public-params", "New public param for cicada vote instance")
    .addOptionalParam("expiry", "Voting expiry")
    .setAction(
        async (args, hre) => {

            const expiry = Number(args.expiry) ? Number(args.expiry) : Math.floor(Date.now() / 1000 + 60 * 5)
            const secondsToExpiry = Math.round((expiry - (Date.now() / 1000)))
            console.log("life time : " + formatSeconds(secondsToExpiry));

            const pp = generatePublicParameters(secondsToExpiry)

            console.log("Generated a new public parameter and saved to pp.json\n", pp)
            writeFileSync("pp.json", `${JSON.stringify(pp, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )}`)
        }
    );