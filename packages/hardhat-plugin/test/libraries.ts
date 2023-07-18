/* eslint-disable import/no-unused-modules */
import { defineModule } from "@ignored/ignition-core";
import { assert } from "chai";

import { useEphemeralIgnitionProject } from "./use-ignition-project";

// TODO: fix libraries in execution
describe.skip("libraries", () => {
  useEphemeralIgnitionProject("minimal-new-api");

  it("should be able to deploy a contract that depends on a hardhat library", async function () {
    const moduleDefinition = defineModule("WithLibModule", (m) => {
      const rubbishMath = m.library("RubbishMath");
      const dependsOnLib = m.contract("DependsOnLib", [], {
        libraries: {
          RubbishMath: rubbishMath,
        },
      });

      return { rubbishMath, dependsOnLib };
    });

    const result = await this.deploy(moduleDefinition);

    assert.isDefined(result);
    const contractThatDependsOnLib = result.dependsOnLib;

    const libBasedAddtion = await contractThatDependsOnLib.addThreeNumbers(
      1,
      2,
      3
    );

    assert.equal(libBasedAddtion, 6);
  });

  it("should be able to deploy a contract that depends on an artifact library", async function () {
    await this.hre.run("compile", { quiet: true });

    const libraryArtifact = await this.hre.artifacts.readArtifact(
      "RubbishMath"
    );

    const moduleDefinition = defineModule("ArtifactLibraryModule", (m) => {
      const rubbishMath = m.libraryFromArtifact("RubbishMath", libraryArtifact);
      const dependsOnLib = m.contract("DependsOnLib", [], {
        libraries: {
          RubbishMath: rubbishMath,
        },
      });

      return { rubbishMath, dependsOnLib };
    });

    const result = await this.deploy(moduleDefinition);

    assert.isDefined(result);
    const contractThatDependsOnLib = result.dependsOnLib;

    const libBasedAddtion = await contractThatDependsOnLib.addThreeNumbers(
      1,
      2,
      3
    );

    assert.equal(libBasedAddtion, 6);
  });

  it("should deploy a contract with an existing library", async function () {
    const libraryModuleDefinition = defineModule("LibraryModule", (m) => {
      const rubbishMath = m.library("RubbishMath");

      return { rubbishMath };
    });

    const libDeployResult = await this.deploy(libraryModuleDefinition);

    const libAddress = libDeployResult.rubbishMath.address;
    const libAbi = libDeployResult.rubbishMath.abi;

    const moduleDefinition = defineModule("ConsumingLibModule", (m) => {
      const rubbishMath = m.contractAt("RubbishMath", libAddress, libAbi);

      const dependsOnLib = m.contract("DependsOnLib", [], {
        libraries: {
          RubbishMath: rubbishMath,
        },
      });

      return { dependsOnLib };
    });

    const result = await this.deploy(moduleDefinition);

    assert.equal(await libDeployResult.rubbishMath.add(1, 2), 3);
    assert.equal(await result.dependsOnLib.addThreeNumbers(1, 2, 3), 6);
  });
});
