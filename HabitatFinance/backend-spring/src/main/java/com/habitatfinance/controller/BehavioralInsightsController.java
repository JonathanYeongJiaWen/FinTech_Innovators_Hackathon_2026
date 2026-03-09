package com.habitatfinance.controller;

import com.habitatfinance.dto.BehavioralInsightsResponse;
import com.habitatfinance.dto.BehavioralProfileDTO;
import com.habitatfinance.dto.CostOfBehaviorDTO;
import com.habitatfinance.service.BehaviorAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/advisor/clients")
public class BehavioralInsightsController {

    private final BehaviorAnalyticsService behaviorAnalyticsService;

    public BehavioralInsightsController(BehaviorAnalyticsService behaviorAnalyticsService) {
        this.behaviorAnalyticsService = behaviorAnalyticsService;
    }

    /**
     * GET /api/v1/advisor/clients/{clientId}/behavioral-insights
     *
     * Returns the combined Behavioral Health Radar and
     * Cost-of-Behavior (Behavioral Alpha) analysis for the given client.
     */
    @GetMapping("/{clientId}/behavioral-insights")
    public ResponseEntity<BehavioralInsightsResponse> getBehavioralInsights(
            @PathVariable String clientId) {

        BehavioralProfileDTO profile = behaviorAnalyticsService.buildBehavioralProfile(clientId);
        CostOfBehaviorDTO costOfBehavior = behaviorAnalyticsService.calculateGhostPortfolioDiff(clientId);

        BehavioralInsightsResponse response = new BehavioralInsightsResponse(profile, costOfBehavior);
        return ResponseEntity.ok(response);
    }
}
