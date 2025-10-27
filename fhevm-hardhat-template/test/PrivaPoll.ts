import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PrivaPoll, PrivaPoll__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("PrivaPoll")) as PrivaPoll__factory;
  const contract = (await factory.deploy()) as PrivaPoll;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("PrivaPoll", function () {
  let signers: Signers;
  let contract: PrivaPoll;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Poll Creation", function () {
    it("should create a poll successfully", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "What is your favorite color?",
          options: ["Red", "Blue", "Green"],
        },
      ]);

      const tx = await contract
        .connect(signers.alice)
        .createPoll(
          "Test Poll",
          "This is a test poll",
          now,
          now + 3600,
          questionsData,
          1,
          true
        );

      await expect(tx).to.emit(contract, "PollCreated");

      const pollInfo = await contract.getPollInfo(0);
      expect(pollInfo.title).to.equal("Test Poll");
      expect(pollInfo.creator).to.equal(signers.alice.address);
      expect(pollInfo.questionCount).to.equal(1);
      expect(pollInfo.isPublic).to.be.true;
      expect(pollInfo.isActive).to.be.true;
    });

    it("should track creator's polls", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Question 1",
          options: ["A", "B"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Poll 1", "Description", now, now + 3600, questionsData, 1, true);

      await contract
        .connect(signers.alice)
        .createPoll("Poll 2", "Description", now, now + 3600, questionsData, 1, true);

      const alicePolls = await contract.getPollsByCreator(signers.alice.address);
      expect(alicePolls.length).to.equal(2);
      expect(alicePolls[0]).to.equal(0);
      expect(alicePolls[1]).to.equal(1);
    });
  });

  describe("Response Submission", function () {
    let pollId: number;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Question 1",
          options: ["Option A", "Option B", "Option C"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Test Poll", "Description", now, now + 3600, questionsData, 1, true);

      pollId = 0;
    });

    it("should submit encrypted response successfully", async function () {
      // Encrypt answer: option index 1
      const encryptedAnswer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      const tx = await contract
        .connect(signers.bob)
        .submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof);

      await expect(tx).to.emit(contract, "ResponseSubmitted");

      const hasResponded = await contract.hasResponded(pollId, signers.bob.address);
      expect(hasResponded).to.be.true;

      const pollInfo = await contract.getPollInfo(pollId);
      expect(pollInfo.responseCount).to.equal(1);
    });

    it("should prevent double responses", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(0)
        .encrypt();

      await contract
        .connect(signers.bob)
        .submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof);

      await expect(
        contract.connect(signers.bob).submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof)
      ).to.be.revertedWithCustomError(contract, "AlreadyResponded");
    });

    it("should reject responses with wrong answer count", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(0)
        .add32(1)
        .encrypt();

      await expect(
        contract
          .connect(signers.bob)
          .submitResponse(pollId, [encryptedInput.handles[0], encryptedInput.handles[1]], encryptedInput.inputProof)
      ).to.be.revertedWithCustomError(contract, "InvalidAnswerCount");
    });

    it("should track respondent's polls", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(2)
        .encrypt();

      await contract
        .connect(signers.bob)
        .submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof);

      const bobResponses = await contract.getResponsesBySender(signers.bob.address);
      expect(bobResponses.length).to.equal(1);
      expect(bobResponses[0]).to.equal(pollId);
    });
  });

  describe("Poll Closing", function () {
    it("should allow creator to close poll", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Test",
          options: ["A", "B"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Test Poll", "Description", now, now + 3600, questionsData, 1, true);

      const pollId = 0;

      const tx = await contract.connect(signers.alice).closePoll(pollId);
      await expect(tx).to.emit(contract, "PollClosed");

      const pollInfo = await contract.getPollInfo(pollId);
      expect(pollInfo.isActive).to.be.false;
    });

    it("should prevent non-creator from closing poll", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Test",
          options: ["A", "B"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Test Poll", "Description", now, now + 3600, questionsData, 1, true);

      const pollId = 0;

      await expect(
        contract.connect(signers.bob).closePoll(pollId)
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("should reject responses to closed poll", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Test",
          options: ["A", "B"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Test Poll", "Description", now, now + 3600, questionsData, 1, true);

      const pollId = 0;

      await contract.connect(signers.alice).closePoll(pollId);

      const encryptedAnswer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(0)
        .encrypt();

      await expect(
        contract.connect(signers.bob).submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof)
      ).to.be.revertedWithCustomError(contract, "PollEnded");
    });
  });

  describe("Response Retrieval", function () {
    it("should allow creator to retrieve responses", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Question",
          options: ["A", "B"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Test Poll", "Description", now, now + 3600, questionsData, 1, true);

      const pollId = 0;

      const encryptedAnswer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      await contract
        .connect(signers.bob)
        .submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof);

      const responses = await contract.connect(signers.alice).getPollResponses(pollId);
      expect(responses).to.be.an("array");
    });

    it("should allow user to retrieve own responses", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Question",
          options: ["A", "B", "C"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Test Poll", "Description", now, now + 3600, questionsData, 1, true);

      const pollId = 0;

      const encryptedAnswer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(2)
        .encrypt();

      await contract
        .connect(signers.bob)
        .submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof);

      const userResponses = await contract
        .connect(signers.bob)
        .getUserResponses(pollId, signers.bob.address);

      expect(userResponses.length).to.equal(1);

      // Decrypt to verify
      const clearAnswer = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userResponses[0],
        contractAddress,
        signers.bob
      );

      expect(clearAnswer).to.equal(2);
    });

    it("should prevent unauthorized access to responses", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Question",
          options: ["A", "B"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Test Poll", "Description", now, now + 3600, questionsData, 1, true);

      const pollId = 0;

      const encryptedAnswer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(0)
        .encrypt();

      await contract
        .connect(signers.bob)
        .submitResponse(pollId, [encryptedAnswer.handles[0]], encryptedAnswer.inputProof);

      await expect(
        contract.connect(signers.charlie).getPollResponses(pollId)
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });
  });

  describe("Multiple Questions", function () {
    it("should handle multiple questions correctly", async function () {
      const now = Math.floor(Date.now() / 1000);
      const questionsData = JSON.stringify([
        {
          type: 0,
          text: "Question 1",
          options: ["A", "B"],
        },
        {
          type: 0,
          text: "Question 2",
          options: ["X", "Y", "Z"],
        },
        {
          type: 1,
          text: "Question 3 (Multiple)",
          options: ["Option 1", "Option 2", "Option 3"],
        },
      ]);

      await contract
        .connect(signers.alice)
        .createPoll("Multi-Question Poll", "Description", now, now + 3600, questionsData, 3, true);

      const pollId = 0;

      // Encrypt all three answers together
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(0)  // First option of Q1
        .add32(2)  // Third option of Q2
        .add32(5)  // Multiple choice: bitmask for options 0 and 2 (binary: 101 = 5)
        .encrypt();

      const tx = await contract
        .connect(signers.bob)
        .submitResponse(
          pollId,
          [encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.handles[2]],
          encryptedInput.inputProof
        );

      await expect(tx).to.emit(contract, "ResponseSubmitted");

      const userResponses = await contract
        .connect(signers.bob)
        .getUserResponses(pollId, signers.bob.address);

      expect(userResponses.length).to.equal(3);

      // Decrypt and verify
      const clear1 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userResponses[0],
        contractAddress,
        signers.bob
      );
      const clear2 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userResponses[1],
        contractAddress,
        signers.bob
      );
      const clear3 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userResponses[2],
        contractAddress,
        signers.bob
      );

      expect(clear1).to.equal(0);
      expect(clear2).to.equal(2);
      expect(clear3).to.equal(5);
    });
  });
});

