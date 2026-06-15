package com.renewal.service;

import com.renewal.dto.ScoreChartDTO;

import java.util.List;

public interface ScoreFeedbackService {

    ScoreChartDTO getScoreChart(Long enrollmentId);

    List<ScoreChartDTO> getBatchScoreCharts(List<Long> enrollmentIds);
}
