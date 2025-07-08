// Simulate $100 USD balance for 1.5 hours using live market data
// Run: node scripts/simulateArbBalance.js

const axios = require('axios');

let balance = 100; // USD
const start = Date.now();
const end = start + 1.5 * 60 * 60 * 1000; // 1.5 hours
const tradeLog = [];

async function fetchLiveOpportunities() {
  // Example: Fetch ETH/USDC price from Coingecko
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            const ethPrice = res.data.ethereum.usd;
                // Simulate a random opportunity (replace with your real scanner)
                    return [{
                          pair: 'ETH/USDC',
                                price: ethPrice,
                                      estProfit: Math.random() > 0.7 ? Math.random() * 2 : 0, // Simulate rare profitable opps
                                            gas: 2 + Math.random() * 3 // Simulate gas cost in USD
                                                }];
                                                  } catch (e) {
                                                      return [];
                                                        }
                                                        }

                                                        async function simulate() {
                                                          while (Date.now() < end) {
                                                              const opportunities = await fetchLiveOpportunities();
                                                                  for (const opp of opportunities) {
                                                                        if (opp.estProfit > opp.gas) {
                                                                                balance += opp.estProfit - opp.gas;
                                                                                        tradeLog.push({
                                                                                                  time: new Date().toISOString(),
                                                                                                            pair: opp.pair,
                                                                                                                      profit: opp.estProfit,
                                                                                                                                gas: opp.gas,
                                                                                                                                          net: opp.estProfit - opp.gas,
                                                                                                                                                    balance: balance.toFixed(2)
                                                                                                                                                            });
                                                                                                                                                                  }
                                                                                                                                                                      }
                                                                                                                                                                          await new Promise(r => setTimeout(r, 5000)); // 5s interval
                                                                                                                                                                            }
                                                                                                                                                                              console.log('Simulation complete. Final balance:', balance.toFixed(2), 'USD');
                                                                                                                                                                                console.table(tradeLog);
                                                                                                                                                                                }

                                                                                                                                                                                simulate();
                                                                                                                                                                                