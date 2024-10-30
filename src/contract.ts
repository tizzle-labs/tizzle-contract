import {
  NearBindgen,
  near,
  call,
  view,
  initialize,
  assert,
  Balance,
} from "near-sdk-js";

@NearBindgen({})
class TokenPurchase {
  owner: string;
  contractAddress: string;

  constructor() {
    this.owner = "";
    this.contractAddress = "";
  }

  @initialize({})
  init({ owner }: { owner: string }): void {
    assert(owner.length > 0, "Define owner");
    this.owner = owner;
    this.contractAddress = near.currentAccountId();
  }

  @view({})
  getOwner(): string {
    return this.owner;
  }

  @view({})
  balance(): string {
    return near.accountBalance().toString();
  }

  @call({ payableFunction: true })
  buyToken(): void {
    const buyerAccountId = near.predecessorAccountId();
    const depositAmount = near.attachedDeposit();

    assert(
      depositAmount > BigInt(0),
      "amount transfer should grater than from 0"
    );

    const initialBalance = near.accountBalance();
    near.log(`Init contract saldo: ${initialBalance}`);
    near.log(`Deposit amount: ${depositAmount}`);

    near.log(
      `Receive ${depositAmount} yoctoNEAR from ${buyerAccountId} for purchasing token`
    );

    const finalBalance = near.accountBalance();
    near.log(`last saldo contract: ${finalBalance}`);
    near.log(
      `coverage saldo: ${BigInt(finalBalance) - BigInt(initialBalance)}`
    );

    near.log(`token buy from ${buyerAccountId}. amount NEAR: ${depositAmount}`);
  }

  @call({})
  setOwner({ newOwner }: { newOwner: string }): void {
    assert(
      near.predecessorAccountId() === this.owner,
      "only owner can edit owner"
    );
    assert(newOwner.length > 0, "define id owner");
    this.owner = newOwner;
    near.log(`contract owner edited to be ${newOwner}`);
  }
}
