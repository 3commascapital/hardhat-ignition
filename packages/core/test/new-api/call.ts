import { assert } from "chai";

import { defineModule } from "../../src/new-api/define-module";
import { NamedContractCallFutureImplementation } from "../../src/new-api/internal/module";
import { ModuleConstructor } from "../../src/new-api/internal/module-builder";
import { FutureType } from "../../src/new-api/types/module";

describe("call", () => {
  it("should be able to setup a contract call", () => {
    const moduleWithASingleContractDefinition = defineModule("Module1", (m) => {
      const contract1 = m.contract("Contract1");

      m.call(contract1, "test");

      return { contract1 };
    });

    const constructor = new ModuleConstructor(0, []);
    const moduleWithASingleContract = constructor.construct(
      moduleWithASingleContractDefinition
    );

    assert.isDefined(moduleWithASingleContract);

    // Sets ids based on module id and contract name
    assert.equal(moduleWithASingleContract.id, "Module1");
    assert.equal(
      moduleWithASingleContract.results.contract1.id,
      "Module1:Contract1"
    );

    // 1 contract future & 1 call future
    assert.equal(moduleWithASingleContract.futures.size, 2);
    assert.equal(
      [...moduleWithASingleContract.futures][0].type,
      FutureType.NAMED_CONTRACT_DEPLOYMENT
    );
    assert.equal(
      [...moduleWithASingleContract.futures][1].type,
      FutureType.NAMED_CONTRACT_CALL
    );

    // No submodules
    assert.equal(moduleWithASingleContract.submodules.size, 0);
  });

  it("should be able to pass one contract as an arg dependency to a call", () => {
    const moduleWithDependentContractsDefinition = defineModule(
      "Module1",
      (m) => {
        const example = m.contract("Example");
        const another = m.contract("Another");

        m.call(example, "test", [another]);

        return { example, another };
      }
    );

    const constructor = new ModuleConstructor(0, []);
    const moduleWithDependentContracts = constructor.construct(
      moduleWithDependentContractsDefinition
    );

    assert.isDefined(moduleWithDependentContracts);

    const exampleFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Example"
    );

    const anotherFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Example"
    );

    const callFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Example#test"
    );

    if (!(callFuture instanceof NamedContractCallFutureImplementation)) {
      assert.fail("Not a named contract call future");
    }

    assert.equal(callFuture.dependencies.size, 2);
    assert(callFuture.dependencies.has(exampleFuture!));
    assert(callFuture.dependencies.has(anotherFuture!));
  });

  it("should be able to pass one contract as an after dependency of a call", () => {
    const moduleWithDependentContractsDefinition = defineModule(
      "Module1",
      (m) => {
        const example = m.contract("Example");
        const another = m.contract("Another");

        m.call(example, "test", [], { after: [another] });

        return { example, another };
      }
    );

    const constructor = new ModuleConstructor(0, []);
    const moduleWithDependentContracts = constructor.construct(
      moduleWithDependentContractsDefinition
    );

    assert.isDefined(moduleWithDependentContracts);

    const exampleFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Example"
    );

    const anotherFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Another"
    );

    const callFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Example#test"
    );

    if (!(callFuture instanceof NamedContractCallFutureImplementation)) {
      assert.fail("Not a named contract deployment");
    }

    assert.equal(callFuture.dependencies.size, 2);
    assert(callFuture.dependencies.has(exampleFuture!));
    assert(callFuture.dependencies.has(anotherFuture!));
  });

  it("should be able to pass value as an option", () => {
    const moduleWithDependentContractsDefinition = defineModule(
      "Module1",
      (m) => {
        const example = m.contract("Example");

        m.call(example, "test", [], { value: BigInt(42) });

        return { example };
      }
    );

    const constructor = new ModuleConstructor(0, []);
    const moduleWithDependentContracts = constructor.construct(
      moduleWithDependentContractsDefinition
    );

    assert.isDefined(moduleWithDependentContracts);

    const callFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Example#test"
    );

    if (!(callFuture instanceof NamedContractCallFutureImplementation)) {
      assert.fail("Not a named contract deployment");
    }

    assert.equal(callFuture.value, BigInt(42));
  });

  it("should be able to pass from as an option", () => {
    const moduleWithDependentContractsDefinition = defineModule(
      "Module1",
      (m) => {
        const example = m.contract("Example");

        m.call(example, "test", [], { from: m.accounts[1] });

        return { example };
      }
    );

    const constructor = new ModuleConstructor(0, ["0x1", "0x2"]);
    const moduleWithDependentContracts = constructor.construct(
      moduleWithDependentContractsDefinition
    );

    assert.isDefined(moduleWithDependentContracts);

    const callFuture = [...moduleWithDependentContracts.futures].find(
      ({ id }) => id === "Module1:Example#test"
    );

    if (!(callFuture instanceof NamedContractCallFutureImplementation)) {
      assert.fail("Not a named contract deployment");
    }

    assert.equal(callFuture.from, "0x2");
  });

  describe("passing id", () => {
    it("should be able to call the same function twice by passing an id", () => {
      const moduleWithSameCallTwiceDefinition = defineModule("Module1", (m) => {
        const sameContract1 = m.contract("Example");

        m.call(sameContract1, "test", [], { id: "first" });
        m.call(sameContract1, "test", [], { id: "second" });

        return { sameContract1 };
      });

      const constructor = new ModuleConstructor(0, []);
      const moduleWithSameCallTwice = constructor.construct(
        moduleWithSameCallTwiceDefinition
      );

      assert.equal(moduleWithSameCallTwice.id, "Module1");

      const callFuture = [...moduleWithSameCallTwice.futures].find(
        ({ id }) => id === "Module1:Example#first"
      );

      const callFuture2 = [...moduleWithSameCallTwice.futures].find(
        ({ id }) => id === "Module1:Example#second"
      );

      assert.isDefined(callFuture);
      assert.isDefined(callFuture2);
    });

    it("should throw if the same function is called twice without differentiating ids", () => {
      const moduleDefinition = defineModule("Module1", (m) => {
        const sameContract1 = m.contract("SameContract");
        m.call(sameContract1, "test");
        m.call(sameContract1, "test");

        return { sameContract1 };
      });

      const constructor = new ModuleConstructor(0, []);

      assert.throws(
        () => constructor.construct(moduleDefinition),
        /Duplicated id Module1:SameContract#test found in module Module1/
      );
    });

    it("should throw if a call tries to pass the same id twice", () => {
      const moduleDefinition = defineModule("Module1", (m) => {
        const sameContract1 = m.contract("SameContract");
        m.call(sameContract1, "test", [], { id: "first" });
        m.call(sameContract1, "test", [], { id: "first" });
        return { sameContract1 };
      });

      const constructor = new ModuleConstructor(0, []);

      assert.throws(
        () => constructor.construct(moduleDefinition),
        /Duplicated id Module1:SameContract#first found in module Module1/
      );
    });
  });
});