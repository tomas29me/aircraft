//  Copyright (c) 2026
//  SPDX-License-Identifier: GPL-3.0

export type A380RunwayCondition = 'DRY' | 'WET' | 'CONTAMINATED';
export type A380TakeoffFlapConfig = 'CONF 1+F' | 'CONF 2' | 'CONF 3';
export type A380AntiIceConfig = 'OFF' | 'ENG' | 'ENG+WING';
export type A380ThrustMode = 'TOGA' | 'FLEX';

export interface A380TakeoffPerformanceInput {
  airport: string;
  runway: string;
  runwayLengthM: number;
  runwayHeadingDeg: number;
  elevationFt: number;
  slopePercent: number;
  oatC: number;
  qnhHpa: number;
  windDirectionDeg: number;
  windSpeedKt: number;
  towKg: number;
  cgPercentMac: number;
  flapConfig: A380TakeoffFlapConfig;
  runwayCondition: A380RunwayCondition;
  packsOn: boolean;
  antiIce: A380AntiIceConfig;
  thrustMode: A380ThrustMode;
}

export interface A380TakeoffPerformanceResult {
  v1: number;
  vr: number;
  v2: number;
  flexTempC: number | null;
  ths: string;
  requiredDistanceM: number;
  runwayMarginM: number;
  fieldLimitWeightKg: number;
  climbLimitWeightKg: number;
  limitingFactor: 'FIELD' | 'CLIMB' | 'TIRE SPEED' | 'BRAKE ENERGY' | 'NONE';
  status: 'T.O POSSIBLE' | 'T.O NOT POSSIBLE';
  warnings: string[];
}

/**
 * Initial A380X takeoff performance model.
 *
 * This is a simulator-oriented model, not real-world Airbus operational data.
 * The architecture is intentionally separated from the OIT page so it can later
 * be replaced with proper tabulated/validated performance data.
 */
export function calculateA380TakeoffPerformance(input: A380TakeoffPerformanceInput): A380TakeoffPerformanceResult {
  const pressureAltitudeFt = input.elevationFt + (1013.25 - input.qnhHpa) * 27;
  const isaTempC = 15 - 1.98 * (input.elevationFt / 1000);
  const densityAltitudeFt = pressureAltitudeFt + 118.8 * (input.oatC - isaTempC);

  const windAngleRad = ((input.windDirectionDeg - input.runwayHeadingDeg) * Math.PI) / 180;
  const headwindKt = input.windSpeedKt * Math.cos(windAngleRad);

  const towAboveReferenceT = (input.towKg - 500_000) / 1000;

  const flapV2Adjustment =
    input.flapConfig === 'CONF 1+F'
      ? 5
      : input.flapConfig === 'CONF 2'
        ? 0
        : -3;

  const conditionSpeedAdjustment =
    input.runwayCondition === 'DRY'
      ? 0
      : input.runwayCondition === 'WET'
        ? 2
        : 5;

  const baseV2 = 146 + towAboveReferenceT * 0.115 + flapV2Adjustment + conditionSpeedAdjustment;
  const v2 = clamp(round(baseV2), 138, 175);
  const vr = clamp(v2 - 4, 130, 172);
  const v1 = clamp(vr - 5, 120, vr);

  const conditionDistancePenaltyM =
    input.runwayCondition === 'DRY'
      ? 0
      : input.runwayCondition === 'WET'
        ? 280
        : 850;

  const antiIcePenaltyM =
    input.antiIce === 'OFF'
      ? 0
      : input.antiIce === 'ENG'
        ? 120
        : 260;

  const packsPenaltyM = input.packsOn ? 120 : 0;
  const tailwindPenaltyM = headwindKt < 0 ? Math.abs(headwindKt) * 80 : 0;
  const headwindCreditM = headwindKt > 0 ? Math.min(headwindKt, 20) * 18 : 0;

  const requiredDistanceM = round(
    2450
      + towAboveReferenceT * 7.5
      + densityAltitudeFt * 0.075
      + input.slopePercent * 180
      + conditionDistancePenaltyM
      + antiIcePenaltyM
      + packsPenaltyM
      + tailwindPenaltyM
      - headwindCreditM,
  );

  const runwayMarginM = round(input.runwayLengthM - requiredDistanceM);

  const fieldLimitWeightKg = round(input.towKg + runwayMarginM / 7.5 * 1000);
  const climbLimitWeightKg = round(
    575_000
      - Math.max(0, densityAltitudeFt) * 7
      - (input.antiIce === 'OFF' ? 0 : input.antiIce === 'ENG' ? 3000 : 6500)
      - (input.packsOn ? 2500 : 0),
  );

  const tireSpeedLimited = vr >= 172;
  const brakeEnergyLimited = input.towKg > 570_000 && runwayMarginM < 500;

  let limitingFactor: A380TakeoffPerformanceResult['limitingFactor'] = 'NONE';

  if (runwayMarginM < 0) {
    limitingFactor = 'FIELD';
  } else if (input.towKg > climbLimitWeightKg) {
    limitingFactor = 'CLIMB';
  } else if (tireSpeedLimited) {
    limitingFactor = 'TIRE SPEED';
  } else if (brakeEnergyLimited) {
    limitingFactor = 'BRAKE ENERGY';
  }

  const status = limitingFactor === 'NONE' ? 'T.O POSSIBLE' : 'T.O NOT POSSIBLE';

  const flexTempC =
    input.thrustMode === 'TOGA'
      ? null
      : clamp(
          round(
            58
              - Math.max(0, densityAltitudeFt) / 1800
              - towAboveReferenceT * 0.08
              + Math.max(0, headwindKt) * 0.12
              - (input.packsOn ? 2 : 0)
              - (input.antiIce === 'OFF' ? 0 : input.antiIce === 'ENG' ? 2 : 4),
          ),
          input.oatC + 5,
          65,
        );

  const thsValue = clamp((34 - input.cgPercentMac) * 0.7, 0.5, 3.5);
  const ths = `${thsValue.toFixed(1)} UP`;

  const warnings: string[] = [];

  if (runwayMarginM < 0) {
    warnings.push('FIELD LIMITED - REDUCE TOW OR USE LONGER RUNWAY');
  }

  if (input.towKg > climbLimitWeightKg) {
    warnings.push('CLIMB LIMITED - REDUCE TOW OR USE TOGA');
  }

  if (headwindKt < -10) {
    warnings.push('TAILWIND ABOVE 10 KT');
  }

  if (input.runwayCondition === 'CONTAMINATED') {
    warnings.push('CONTAMINATED RUNWAY - CONSERVATIVE PENALTIES APPLIED');
  }

  if (input.thrustMode === 'FLEX' && flexTempC !== null && flexTempC <= input.oatC + 5) {
    warnings.push('LOW FLEX MARGIN - CONSIDER TOGA');
  }

  return {
    v1,
    vr,
    v2,
    flexTempC,
    ths,
    requiredDistanceM,
    runwayMarginM,
    fieldLimitWeightKg,
    climbLimitWeightKg,
    limitingFactor,
    status,
    warnings,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value);
}