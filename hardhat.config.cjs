require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');
require('solidity-coverage');
const { subtask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require('hardhat/builtin-tasks/task-names');
// Use the pinned local compiler: clean checkouts do not need a compiler download.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async ({ solcVersion }, _, runSuper) => {
  if (solcVersion !== '0.8.24') return runSuper();
  return { compilerPath: require.resolve('solc/soljson.js'), isSolcJs: true,
    version: solcVersion, longVersion: require('solc').version() };
});
module.exports = {
  solidity: { version: '0.8.24', settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris' } },
  paths: { tests: './test/contract' },
};
