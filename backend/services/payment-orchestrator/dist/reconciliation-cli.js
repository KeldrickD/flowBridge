"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reconciliation_1 = require("./workers/reconciliation");
async function main() {
    try {
        await (0, reconciliation_1.runReconciliationOnce)();
        process.exit(0);
    }
    catch (err) {
        console.error("Reconciliation run failed", err);
        process.exit(1);
    }
}
main();
