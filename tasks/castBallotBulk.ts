import { task, types } from "hardhat/config";
import { existsSync } from "fs"
import { csvToJson, BetRecordRaw, recentlyCreatedId } from "../utils"

// npx hardhat bulk-cast-ballot --path "edge_case.csv" --id '1' --network localhost
task("bulk-cast-ballot", "Will place bets with csv file details")
    .addOptionalParam("id", "Voting istance id")
    .addParam("path", "CSV file path", undefined, types.string)
    .setAction(
        async (args, hre) => {
            if (!existsSync(args.path)) {
                console.log("File doesn't exists");
                return;
            }

            const id = args.id | recentlyCreatedId();

            const betRecords = await csvToJson(args.path) as BetRecordRaw[]

            for (let i = 0; i < betRecords.length; i++) {
                const betRecord = betRecords[i]

                await hre.run("cast-ballot", {
                    id: id.toString(),
                    vote: betRecord.choiceQ == 'true' ? 'YES' : 'NO',
                    bettor: betRecord.address
                })
            }
        }
    );