import anyTest from "ava";
import { Worker } from "near-workspaces";
import { setDefaultResultOrder } from "dns";
setDefaultResultOrder("ipv4first"); // temp fix for node >v17

/**
 *  @typedef {import('near-workspaces').NearAccount} NearAccount
 *  @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */
const test = anyTest;

test.beforeEach(async (t) => {
  const worker = (t.context.worker = await Worker.init());

  const root = worker.rootAccount;
  const contract = await root.createSubAccount("test-account");

  await contract.deploy(process.argv[2]);

  await contract.call(contract, "init", {
    owner: root.accountId,
  });

  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log("failed stop sandbox:", error);
  });
});

test("return contract owner", async (t) => {
  const { contract, root } = t.context.accounts;
  const owner = await contract.view("getOwner");
  t.is(owner, root.accountId);
});

test("buy token", async (t) => {
  const { root, contract } = t.context.accounts;
  const initialBalance = await contract.balance();

  const depositAmount = "1000000000000000000000000"; // 1 NEAR

  await root.call(contract, "buyToken", {}, { attachedDeposit: depositAmount });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const newBalance = await contract.balance();
  const balanceDifference =
    BigInt(newBalance.available) - BigInt(initialBalance.available);

  const percentageDifference =
    (Math.abs(Number(balanceDifference) - Number(depositAmount)) /
      Number(depositAmount)) *
    100;

  t.true(
    percentageDifference <= 1,
    `Different saldo: ${balanceDifference}, Deposit: ${depositAmount}, different persentance: ${percentageDifference.toFixed(
      2
    )}%`
  );
});

test("onyly owner can edit owner", async (t) => {
  const { root, contract } = t.context.accounts;
  const nonOwner = await root.createSubAccount("non-owner");
  const newOwner = await root.createSubAccount("new-owner");

  await t.throwsAsync(
    async () => {
      await nonOwner.call(contract, "setOwner", {
        newOwner: newOwner.accountId,
      });
    },
    { message: /only owner can edit owner/ }
  );
});

test("owner can edit owner", async (t) => {
  const { root, contract } = t.context.accounts;
  const newOwner = await root.createSubAccount("new-owner");

  await root.call(contract, "setOwner", { newOwner: newOwner.accountId });
  const updatedOwner = await contract.view("getOwner");
  t.is(updatedOwner, newOwner.accountId);
});

test("cant buy token with deposit 0", async (t) => {
  const { root, contract } = t.context.accounts;

  await t.throwsAsync(
    async () => {
      await root.call(contract, "buyToken", {}, { attachedDeposit: "0" });
    },
    { message: /amount transfer should grater than from 0/ }
  );
});
