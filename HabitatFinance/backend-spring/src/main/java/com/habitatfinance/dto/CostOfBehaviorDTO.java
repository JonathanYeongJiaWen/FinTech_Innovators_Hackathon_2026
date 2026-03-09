package com.habitatfinance.dto;

import java.math.BigDecimal;

/**
 * Cost-of-Behavior (Behavioral Alpha) — tracks the financial impact
 * of emotional / impulse trading versus a disciplined buy-and-hold baseline.
 */
public class CostOfBehaviorDTO {

    /** The client's real, current portfolio value. */
    private BigDecimal actualPortfolioValue;

    /**
     * Simulated portfolio value had the client simply held a benchmark
     * allocation (the "ghost portfolio") without any discretionary trades.
     */
    private BigDecimal ghostPortfolioValue;

    /**
     * Dollar difference: actualPortfolioValue − ghostPortfolioValue.
     * Positive → client outperformed the baseline ("behavioral alpha").
     * Negative → emotional trading destroyed value.
     */
    private BigDecimal behavioralAlpha;

    /**
     * Qualitative indicator of the alpha direction.
     * Possible values: MISSED_GAINS, PREVENTED_LOSSES, NEUTRAL.
     */
    private AlphaDirection alphaDirection;

    public enum AlphaDirection {
        MISSED_GAINS,
        PREVENTED_LOSSES,
        NEUTRAL
    }

    public CostOfBehaviorDTO() {}

    public CostOfBehaviorDTO(BigDecimal actualPortfolioValue,
                             BigDecimal ghostPortfolioValue,
                             BigDecimal behavioralAlpha,
                             AlphaDirection alphaDirection) {
        this.actualPortfolioValue = actualPortfolioValue;
        this.ghostPortfolioValue = ghostPortfolioValue;
        this.behavioralAlpha = behavioralAlpha;
        this.alphaDirection = alphaDirection;
    }

    public BigDecimal getActualPortfolioValue() { return actualPortfolioValue; }
    public void setActualPortfolioValue(BigDecimal actualPortfolioValue) { this.actualPortfolioValue = actualPortfolioValue; }

    public BigDecimal getGhostPortfolioValue() { return ghostPortfolioValue; }
    public void setGhostPortfolioValue(BigDecimal ghostPortfolioValue) { this.ghostPortfolioValue = ghostPortfolioValue; }

    public BigDecimal getBehavioralAlpha() { return behavioralAlpha; }
    public void setBehavioralAlpha(BigDecimal behavioralAlpha) { this.behavioralAlpha = behavioralAlpha; }

    public AlphaDirection getAlphaDirection() { return alphaDirection; }
    public void setAlphaDirection(AlphaDirection alphaDirection) { this.alphaDirection = alphaDirection; }
}
