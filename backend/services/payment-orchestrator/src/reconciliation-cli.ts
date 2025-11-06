import { runReconciliationOnce } from "./workers/reconciliation";

async function main() {
  try {
    await runReconciliationOnce();
    process.exit(0);
  } catch (err) {
    console.error("Reconciliation run failed", err);
    process.exit(1);
  }
}

main();


