import { defineModule } from "@ignored/ignition-core";

const fakeArtifact = ["fake artifact"];

const uniswap = defineModule("Uniswap", (m) => {
  const router = m.contract("UniswapRouter", [1, 2, 3]);

  m.call(router, "configure", [3, 4, 5]);

  return { router };
});

const balancerDefinition = defineModule("Balancer", (m) => {
  const safeMath = m.library("SafeMath");

  const balancer = m.contract("BalancerCore", [], {
    libraries: {
      SafeMath: safeMath,
    },
  });

  const { router } = m.useModule(uniswap);

  m.call(balancer, "setUniswap", [router]);

  return { balancer };
});

const synthetixDefinition = defineModule("Synthetix", (m) => {
  const synthetixCore = m.contractAt("SynthetixCore", "0x0123", fakeArtifact);

  const { router } = m.useModule(uniswap);

  m.call(synthetixCore, "setUniswap", [router]);

  return { synthetix: synthetixCore };
});

const moduleDefinition = defineModule("MyModule", (m) => {
  const { synthetix } = m.useModule(synthetixDefinition);
  const { balancer } = m.useModule(balancerDefinition);

  const testHelper = m.contract("TestHelper");
  const myDefi = m.contract("MyDefi", [], { after: [synthetix, balancer] });

  const { router } = m.useModule(uniswap);

  return { myDefi, router, synthetix, balancer, testHelper };
});

export default moduleDefinition;