package com.habitatfinance.dto;

/**
 * Combined response payload returned by the behavioral-insights endpoint.
 * Wraps both the Behavioral Health Radar and the Cost-of-Behavior analysis.
 */
public class BehavioralInsightsResponse {

    private BehavioralProfileDTO behavioralProfile;
    private CostOfBehaviorDTO costOfBehavior;

    public BehavioralInsightsResponse() {}

    public BehavioralInsightsResponse(BehavioralProfileDTO behavioralProfile,
                                      CostOfBehaviorDTO costOfBehavior) {
        this.behavioralProfile = behavioralProfile;
        this.costOfBehavior = costOfBehavior;
    }

    public BehavioralProfileDTO getBehavioralProfile() { return behavioralProfile; }
    public void setBehavioralProfile(BehavioralProfileDTO behavioralProfile) { this.behavioralProfile = behavioralProfile; }

    public CostOfBehaviorDTO getCostOfBehavior() { return costOfBehavior; }
    public void setCostOfBehavior(CostOfBehaviorDTO costOfBehavior) { this.costOfBehavior = costOfBehavior; }
}
