/* eslint-disable import/no-unused-modules */
import { assert } from "chai";

import { Artifact } from "../src";
import { buildModule } from "../src/build-module";
import {
  ArtifactContractDeploymentFutureImplementation,
  ArtifactLibraryDeploymentFutureImplementation,
  NamedContractDeploymentFutureImplementation,
  NamedLibraryDeploymentFutureImplementation,
} from "../src/internal/module";
import {
  StoredDeploymentDeserializer,
  StoredDeploymentSerializer,
} from "../src/stored-deployment-serializer";
import {
  ContractFuture,
  IgnitionModule,
  IgnitionModuleResult,
} from "../src/types/module";
import { StoredDeployment } from "../src/types/serialized-deployment";

describe("stored deployment serializer", () => {
  const details = {
    networkName: "hardhat",
    chainId: 31117,
  };

  describe("contract", () => {
    it("should serialize a contract deployment", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contract("Contract1");

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a contract deployments with dependency", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contract("Contract1");
        const contract2 = m.contract("Contract2", [contract1]);
        const contract3 = m.contract("Contract3", [], { after: [contract2] });

        return { contract1, contract2, contract3 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a contract deployment with module parameter value", () => {
      const module = buildModule("Module1", (m) => {
        const value = m.getParameter("value", 42n);
        const contract1 = m.contract("Contract1", [], { value });

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("contractFromArtifact", () => {
    const fakeArtifact: Artifact = {
      abi: [],
      contractName: "",
      bytecode: "",
      linkReferences: {},
    };

    it("should serialize a contractFromArtifact deployment", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractFromArtifact("Contract1", fakeArtifact, []);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a contractFromArtifact deployment with dependency", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractFromArtifact("Contract1", fakeArtifact, []);

        const contract2 = m.contractFromArtifact("Contract2", fakeArtifact, [
          contract1,
        ]);

        const contract3 = m.contractFromArtifact(
          "Contract3",
          fakeArtifact,
          [],
          { after: [contract2] }
        );

        return { contract1, contract2, contract3 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("contractAt", () => {
    it("should serialize a contractAt", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractAt("Contract1", "0x0");

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a contractAt with a future address", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractAt("Contract1", "0x0");
        const call = m.staticCall(contract1, "getAddress");
        const contract2 = m.contractAt("Contract2", call);

        return { contract1, contract2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a contractAt with dependency", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractAt("Contract1", "0x0");
        const contract2 = m.contractAt("Contract2", "0x0", {
          after: [contract1],
        });

        return { contract1, contract2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("contractAtFromArtifact", () => {
    const fakeArtifact: Artifact = {
      abi: [],
      contractName: "",
      bytecode: "",
      linkReferences: {},
    };

    it("should serialize a contractAt", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractAtFromArtifact(
          "Contract1",
          "0x0",
          fakeArtifact
        );

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a contractAt with a future address", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractAtFromArtifact(
          "Contract1",
          "0x0",
          fakeArtifact
        );
        const call = m.staticCall(contract1, "getAddress");
        const contract2 = m.contractAtFromArtifact(
          "Contract2",
          call,
          fakeArtifact
        );

        return { contract1, contract2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a contractAt with dependency", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contractAtFromArtifact(
          "Contract1",
          "0x0",
          fakeArtifact
        );
        const contract2 = m.contractAtFromArtifact(
          "Contract2",
          "0x0",
          fakeArtifact,
          {
            after: [contract1],
          }
        );

        return { contract1, contract2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("library", () => {
    const fakeArtifact: Artifact = {
      abi: [],
      contractName: "",
      bytecode: "",
      linkReferences: {},
    };

    it("should serialize a library deployment", () => {
      const module = buildModule("Module1", (m) => {
        const library1 = m.library("Library1");

        return { library1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a library deployment with dependency", () => {
      const module = buildModule("Module1", (m) => {
        const library1 = m.library("Library1");
        const library2 = m.library("Library2", { after: [library1] });

        return {
          library1,
          library2,
        };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a libraries passed in as libraries", () => {
      const module = buildModule("Module1", (m) => {
        const library1 = m.library("Library1");

        const contract2 = m.contract("Contract2", [], {
          libraries: {
            Lib1: library1,
          },
        });

        const contract3 = m.contractFromArtifact(
          "Contract3",
          fakeArtifact,
          [],
          {
            libraries: {
              Lib1: library1,
            },
          }
        );

        const library4 = m.library("Library4", {
          libraries: { Lib1: library1 },
        });

        const library5 = m.libraryFromArtifact("Library5", fakeArtifact, {
          libraries: { Lib1: library1 },
        });

        return {
          library1,
          contract2,
          contract3,
          library4,
          library5,
        };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("libraryFromArtifact", () => {
    const fakeArtifact: Artifact = {
      abi: [],
      contractName: "",
      bytecode: "",
      linkReferences: {},
    };

    it("should serialize a libraryFromArtifact deployment", () => {
      const module = buildModule("Module1", (m) => {
        const library1 = m.libraryFromArtifact("Contract1", fakeArtifact);

        return { library1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a libraryFromArtifact deployment with dependency", () => {
      const module = buildModule("Module1", (m) => {
        const library1 = m.libraryFromArtifact("Library1", fakeArtifact);

        const library2 = m.libraryFromArtifact("Library2", fakeArtifact, {
          after: [library1],
        });

        return { library1, library2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("call", () => {
    it("should serialize a call", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contract("Contract1");

        m.call(contract1, "lock", [1, "a", false]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a call with dependencies", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contract("Contract1");
        const contract2 = m.contract("Contract2");

        m.call(contract2, "lock", [contract1]);
        m.call(contract2, "unlock", [], { after: [contract1] });

        return { contract1, contract2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("static call", () => {
    it("should serialize a call", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contract("Contract1");

        m.staticCall(contract1, "lock", [1, "a", false]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a static call with dependencies", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contract("Contract1");
        const contract2 = m.contract("Contract2");

        m.staticCall(contract2, "lock", [contract1]);
        m.staticCall(contract2, "unlock", [], { after: [contract1] });

        return { contract1, contract2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("Should serialize readEventArgument", () => {
      const module = buildModule("Module1", (m) => {
        const contract1 = m.contract("Contract1");
        const emitter = m.contract("Emitter");

        m.readEventArgument(contract1, "EventName", "nameOrIndex", {
          id: "customId",
          emitter,
          eventIndex: 123,
        });

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });

  describe("useModule", () => {
    it("should serialize a deployment leveraging useModule", () => {
      const submodule = buildModule("Submodule", (m) => {
        const contract1 = m.contract("Contract1");

        return { contract1 };
      });

      const module = buildModule("Module", (m) => {
        const { contract1 } = m.useModule(submodule);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize contract dependencies over the useModule barrier", () => {
      const submodule = buildModule("Submodule", (m) => {
        const contract1 = m.contract("Contract1");

        return { contract1 };
      });

      const module = buildModule("Module", (m) => {
        const { contract1 } = m.useModule(submodule);

        const contract2 = m.contract("Contract2", [contract1]);
        const contract3 = m.contract("Contract3", [], { after: [contract1] });

        return { contract1, contract2, contract3 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should serialize a diamond useModule", () => {
      const bottomModule = buildModule("BottomModule", (m) => {
        const bottomContract = m.contract("Contract1");

        return { bottomContract };
      });

      const leftModule = buildModule("LeftModule", (m) => {
        const { bottomContract } = m.useModule(bottomModule);

        return { leftContract: bottomContract };
      });

      const rightModule = buildModule("RightModule", (m) => {
        const { bottomContract } = m.useModule(bottomModule);

        return { rightContract: bottomContract };
      });

      const module = buildModule("TopModule", (m) => {
        const { leftContract } = m.useModule(leftModule);
        const { rightContract } = m.useModule(rightModule);

        return { leftContract, rightContract };
      });

      const deployment = {
        details,
        module,
      };

      assertSerializableModuleIn(deployment);

      const reserialized = StoredDeploymentDeserializer.deserialize(
        JSON.parse(
          JSON.stringify(
            StoredDeploymentSerializer.serialize(deployment),
            sortedKeysJsonStringifyReplacer
          )
        )
      );

      const lc = reserialized.module.results.leftContract;
      const rc = reserialized.module.results.rightContract;

      assert.equal(lc, rc);
    });
  });

  describe("Complex arguments serialization", () => {
    it("Should support base values as arguments", () => {
      const module = buildModule("Module", (m) => {
        const contract1 = m.contract("Contract1", [1, true, "string", 4n]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("Should support arrays as arguments", () => {
      const module = buildModule("Module", (m) => {
        const contract1 = m.contract("Contract1", [[1, 2, 3n]]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("Should support objects as arguments", () => {
      const module = buildModule("Module", (m) => {
        const contract1 = m.contract("Contract1", [{ a: 1, b: [1, 2] }]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("Should support futures as arguments", () => {
      const module = buildModule("Module", (m) => {
        const contract1 = m.contract("Contract1");
        const contract2 = m.contract("Contract2", [contract1]);

        return { contract1, contract2 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should support nested futures as arguments", () => {
      const module = buildModule("Module", (m) => {
        const contract1 = m.contract("Contract1");
        const contract2 = m.contract("Contract2", [{ arr: [contract1] }]);

        return { contract1, contract2 };
      });

      assert.equal(
        (module.results.contract2.constructorArgs[0] as any).arr[0],
        module.results.contract1
      );
    });

    it("should support AccountRuntimeValues as arguments", () => {
      const module = buildModule("Module", (m) => {
        const account1 = m.getAccount(1);
        const contract1 = m.contract("Contract1", [account1]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should support AccountRuntimeValues as from", () => {
      const module = buildModule("Module", (m) => {
        const account1 = m.getAccount(1);
        const contract1 = m.contract("Contract1", [], { from: account1 });

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should support nested AccountRuntimeValues as arguments", () => {
      const module = buildModule("Module", (m) => {
        const account1 = m.getAccount(1);
        const contract1 = m.contract("Contract1", [{ arr: [account1] }]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should support ModuleParameterRuntimeValue as arguments", () => {
      const module = buildModule("Module", (m) => {
        const p = m.getParameter("p", 123);
        const contract1 = m.contract("Contract1", [p]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });

    it("should support nested ModuleParameterRuntimeValue as arguments", () => {
      const module = buildModule("Module", (m) => {
        const p = m.getParameter("p", 123);
        const contract1 = m.contract("Contract1", [{ arr: [p] }]);

        return { contract1 };
      });

      assertSerializableModuleIn({
        details,
        module,
      });
    });
  });
});

function assertSerializableModuleIn(deployment: StoredDeployment) {
  const serialized = JSON.stringify(
    StoredDeploymentSerializer.serialize(deployment),
    // This is not actually needed, but we use it to be able to compare the
    // serialized string, which can be easier to debug.
    sortedKeysJsonStringifyReplacer,
    2
  );

  const deserialized = StoredDeploymentDeserializer.deserialize(
    JSON.parse(serialized)
  );

  const reserialized = JSON.stringify(
    StoredDeploymentSerializer.serialize(deserialized),
    sortedKeysJsonStringifyReplacer,
    2
  );

  assert.equal(
    serialized,
    reserialized,
    "Module serialization not the same across serialization/deserialization"
  );

  assert.deepEqual(
    deployment,
    deserialized,
    "Module not the same across serialization/deserialization"
  );

  // Invariants

  const ignitionModule = StoredDeploymentDeserializer.deserialize(
    JSON.parse(reserialized)
  ).module;

  assert(
    Object.values(ignitionModule.results).every((result) =>
      hasFutureInModuleOrSubmoduleOf(ignitionModule, result)
    ),
    "All results should be futures of the module or one of its submodules"
  );

  assert(
    allFuturesHaveModuleIn(ignitionModule),
    "All of the modules futures should have their parent module as the linked module"
  );

  // All constructor args have been swapped out
  assert(
    Array.from(ignitionModule.futures).every((future) => {
      if (future instanceof NamedContractDeploymentFutureImplementation) {
        return noFutureTokensIn(future.constructorArgs);
      }

      if (future instanceof ArtifactContractDeploymentFutureImplementation) {
        return noFutureTokensIn(future.constructorArgs);
      }

      return true;
    }),
    "All constructor args should have had their token futures swapped out for actual futures"
  );

  // All libraries have been swapped out
  assert(
    Array.from(ignitionModule.futures).every((future) => {
      if (future instanceof NamedContractDeploymentFutureImplementation) {
        return noFutureTokensInLibraries(future.libraries);
      }

      if (future instanceof ArtifactContractDeploymentFutureImplementation) {
        return noFutureTokensInLibraries(future.libraries);
      }

      if (future instanceof NamedLibraryDeploymentFutureImplementation) {
        return noFutureTokensInLibraries(future.libraries);
      }

      if (future instanceof ArtifactLibraryDeploymentFutureImplementation) {
        return noFutureTokensInLibraries(future.libraries);
      }

      return true;
    }),
    "All libraries should have had their token futures swapped out for actual futures"
  );

  // All dependencies have been swapped out
  assert(
    Array.from(ignitionModule.futures).every((future) => {
      return noFutureTokensIn(Array.from(future.dependencies));
    }),
    "All future dependencies should have had their token futures swapped out for actual futures"
  );
}

function noFutureTokensIn(list: any[]): boolean {
  return list.every((arg) => Boolean(arg) && arg._kind !== "FutureToken");
}

function noFutureTokensInLibraries(libs: { [key: string]: any }): boolean {
  return Object.values(libs).every(
    (arg) => Boolean(arg) && arg._kind !== "FutureToken"
  );
}

function hasFutureInModuleOrSubmoduleOf(
  ignitionModule: IgnitionModule<string, string, IgnitionModuleResult<string>>,
  future: ContractFuture<string>
): unknown {
  if (ignitionModule.futures.has(future)) {
    return true;
  }

  return Array.from(ignitionModule.submodules).some((submodule) =>
    hasFutureInModuleOrSubmoduleOf(submodule, future)
  );
}

function allFuturesHaveModuleIn(
  ignitionModule: IgnitionModule<string, string, IgnitionModuleResult<string>>
): boolean {
  if (
    Array.from(ignitionModule.futures).some(
      (future) =>
        future.module.id === "PLACEHOLDER" && future.module !== ignitionModule
    )
  ) {
    return false;
  }

  return Array.from(ignitionModule.submodules).every((submodule) =>
    allFuturesHaveModuleIn(submodule)
  );
}

function sortedKeysJsonStringifyReplacer(_key: string, value: any) {
  if (!(value instanceof Object) || Array.isArray(value)) {
    return value;
  }
  const sorted = {} as any;
  for (const key of Object.keys(value).sort()) {
    sorted[key] = value[key];
  }

  return sorted;
}
