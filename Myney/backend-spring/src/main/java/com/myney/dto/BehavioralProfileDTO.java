package com.myney.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Behavioral Health Radar — four psychological-bias scores (0-100).
 */
public class BehavioralProfileDTO {

    @Min(0) @Max(100)
    private int lossAversion;

    @Min(0) @Max(100)
    private int overconfidence;

    @Min(0) @Max(100)
    private int herdMentality;

    @Min(0) @Max(100)
    private int dispositionEffect;

    public BehavioralProfileDTO() {}

    public BehavioralProfileDTO(int lossAversion, int overconfidence,
                                int herdMentality, int dispositionEffect) {
        this.lossAversion = lossAversion;
        this.overconfidence = overconfidence;
        this.herdMentality = herdMentality;
        this.dispositionEffect = dispositionEffect;
    }

    public int getLossAversion() { return lossAversion; }
    public void setLossAversion(int lossAversion) { this.lossAversion = lossAversion; }

    public int getOverconfidence() { return overconfidence; }
    public void setOverconfidence(int overconfidence) { this.overconfidence = overconfidence; }

    public int getHerdMentality() { return herdMentality; }
    public void setHerdMentality(int herdMentality) { this.herdMentality = herdMentality; }

    public int getDispositionEffect() { return dispositionEffect; }
    public void setDispositionEffect(int dispositionEffect) { this.dispositionEffect = dispositionEffect; }
}
