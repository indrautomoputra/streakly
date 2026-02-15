const queries = require('../database/queries');

async function getLast30Days() {
  return await queries.getLast30Days();
}

module.exports = {
  getLast30Days
};
