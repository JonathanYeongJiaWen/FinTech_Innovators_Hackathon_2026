package com.myney.service;

import com.myney.dto.BehavioralProfileDTO;
import com.myney.dto.CostOfBehaviorDTO;
import com.myney.dto.CostOfBehaviorDTO.AlphaDirection;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class BehaviorAnalyticsService {

    /**
     * Build the Behavioral Health Radar for a given client.
     *
     * In a full implementation this would:
     *   1. Query the client's trade-event stream for pattern signals
     *      (e.g. panic sells within 24 h of a drawdown → loss-aversion signal).
     *   2. Run each bias-detection heuristic and normalise the raw score to 0-100.
     *   3. Optionally blend in survey / psychometric questionnaire results.
     *
     * @param clientId unique identifier of the advisory client
     * @return populated BehavioralProfileDTO
     */
    public BehavioralProfileDTO buildBehavioralProfile(String clientId) {
        // TODO: replace stub with real bias-detection pipeline
        // Step 1 – Fetch completed trades & order-book snapshots for clientId
        // Step 2 – Loss-Aversion score: ratio of panic-sell events to
        //          total sell events during market drawdowns > 2 %
        // Step 3 – Overconfidence score: frequency of concentrated single-stock
        //          bets vs. diversified rebalances
        // Step 4 – Herd-Mentality score: correlation of client buy/sell timing
        //          with retail-flow surges (e.g. from order-flow data)
        // Step 5 – Disposition-Effect score: average holding period of losing
        //          positions vs. winning positions (longer losers → higher score)

        return new BehavioralProfileDTO(62, 45, 38, 71);
    }

    /**
     * Compute the "Ghost Portfolio" differential for a given client.
     *
     * The ghost portfolio represents what the client's portfolio would be
     * worth today had they simply bought a benchmark allocation on day-one
     * and never traded again.  The difference between the real portfolio
     * and the ghost portfolio is the "behavioralAlpha" — a dollar measure
     * of the cumulative cost (or benefit) of all discretionary trades.
     *
     * Algorithm outline:
     *   1. Retrieve the client's full trade history (buys, sells, transfers).
     *   2. Identify the initial investment date and the total capital deployed.
     *   3. Construct a hypothetical buy-and-hold portfolio using the client's
     *      target benchmark (e.g. 60/40 equities/bonds, or an agreed IPS
     *      allocation) starting from the same capital on the same date.
     *   4. Price both portfolios to today using market-close data:
     *        • actualPortfolioValue  = current real holdings marked to market
     *        • ghostPortfolioValue   = benchmark units × current prices
     *   5. behavioralAlpha = actualPortfolioValue − ghostPortfolioValue
     *   6. Classify the direction:
     *        • alpha < 0   → MISSED_GAINS  (emotional trading cost money)
     *        • alpha > 0   → PREVENTED_LOSSES (or genuine skill / luck)
     *        • alpha == 0  → NEUTRAL
     *
     * @param clientId unique identifier of the advisory client
     * @return populated CostOfBehaviorDTO
     */
    public CostOfBehaviorDTO calculateGhostPortfolioDiff(String clientId) {
        // TODO: replace stub with real trade-history replay engine

        // Step 1 – Fetch all executed trades for clientId from TradeRepository
        // List<Trade> trades = tradeRepository.findAllByClientId(clientId);

        // Step 2 – Determine the inception date & total capital deployed
        // LocalDate inception = trades.stream()
        //     .map(Trade::getExecutionDate)
        //     .min(Comparator.naturalOrder()).orElseThrow();
        // BigDecimal totalCapital = trades.stream()
        //     .filter(t -> t.getSide() == Side.BUY)
        //     .map(Trade::getNetAmount)
        //     .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Step 3 – Build ghost (buy-and-hold) portfolio
        //   Allocate totalCapital into benchmark weights on inception date.
        //   Record the number of units purchased for each asset class.

        // Step 4 – Mark both portfolios to market
        //   actualValue = portfolioService.currentMarketValue(clientId);
        //   ghostValue  = sum of (ghost_units_i × current_price_i)

        // Step 5 – Compute behavioralAlpha
        //   behavioralAlpha = actualValue.subtract(ghostValue);

        // Step 6 – Classify direction
        //   AlphaDirection dir = behavioralAlpha.signum() < 0
        //       ? AlphaDirection.MISSED_GAINS
        //       : behavioralAlpha.signum() > 0
        //           ? AlphaDirection.PREVENTED_LOSSES
        //           : AlphaDirection.NEUTRAL;

        // --- Stub values for demonstration ---
        BigDecimal actualValue = new BigDecimal("1042350.00");
        BigDecimal ghostValue  = new BigDecimal("1087920.00");
        BigDecimal alpha       = actualValue.subtract(ghostValue);

        AlphaDirection direction = alpha.signum() < 0
                ? AlphaDirection.MISSED_GAINS
                : alpha.signum() > 0
                    ? AlphaDirection.PREVENTED_LOSSES
                    : AlphaDirection.NEUTRAL;

        return new CostOfBehaviorDTO(actualValue, ghostValue, alpha, direction);
    }
}
