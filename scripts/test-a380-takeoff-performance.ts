import {
  A380TakeoffPerformanceInput,
  calculateA380TakeoffPerformance,
} from '../fbw-a380x/src/systems/instruments/src/OIT/Pages/FltOps/TakeoffPerformanceCalculator';

const scenarios: A380TakeoffPerformanceInput[] = [
  {
    airport: 'LPPT',
    runway: '03',
    runwayLengthM: 3805,
    runwayHeadingDeg: 29,
    elevationFt: 374,
    slopePercent: 0,
    oatC: 22,
    qnhHpa: 1013,
    windDirectionDeg: 30,
    windSpeedKt: 8,
    towKg: 510_000,
    cgPercentMac: 32.0,
    flapConfig: 'CONF 2',
    runwayCondition: 'DRY',
    packsOn: true,
    antiIce: 'OFF',
    thrustMode: 'FLEX',
  },
  {
    airport: 'KSLC',
    runway: '34R',
    runwayLengthM: 3658,
    runwayHeadingDeg: 344,
    elevationFt: 4227,
    slopePercent: 0,
    oatC: 19,
    qnhHpa: 1013,
    windDirectionDeg: 340,
    windSpeedKt: 5,
    towKg: 535_000,
    cgPercentMac: 32.1,
    flapConfig: 'CONF 2',
    runwayCondition: 'DRY',
    packsOn: true,
    antiIce: 'OFF',
    thrustMode: 'FLEX',
  },
  {
    airport: 'EGLL',
    runway: '27R',
    runwayLengthM: 3902,
    runwayHeadingDeg: 271,
    elevationFt: 83,
    slopePercent: 0,
    oatC: 10,
    qnhHpa: 1008,
    windDirectionDeg: 260,
    windSpeedKt: 12,
    towKg: 560_000,
    cgPercentMac: 30.5,
    flapConfig: 'CONF 2',
    runwayCondition: 'WET',
    packsOn: true,
    antiIce: 'ENG',
    thrustMode: 'FLEX',
  },
];

for (const scenario of scenarios) {
  const result = calculateA380TakeoffPerformance(scenario);

  console.log('='.repeat(72));
  console.log(`${scenario.airport} RWY ${scenario.runway}`);
  console.log(`TOW: ${Math.round(scenario.towKg / 1000)} t | CONF: ${scenario.flapConfig} | ${scenario.runwayCondition}`);
  console.log(`OAT: ${scenario.oatC} °C | QNH: ${scenario.qnhHpa} | WIND: ${scenario.windDirectionDeg}/${scenario.windSpeedKt}`);
  console.log('-'.repeat(72));
  console.log(`STATUS: ${result.status}`);
  console.log(`V1 / VR / V2: ${result.v1} / ${result.vr} / ${result.v2}`);
  console.log(`FLEX: ${result.flexTempC === null ? 'TOGA' : `${result.flexTempC} °C`}`);
  console.log(`THS: ${result.ths}`);
  console.log(`REQ DIST: ${result.requiredDistanceM} m`);
  console.log(`RWY MARGIN: ${result.runwayMarginM} m`);
  console.log(`FIELD LIMIT WT: ${Math.round(result.fieldLimitWeightKg / 1000)} t`);
  console.log(`CLIMB LIMIT WT: ${Math.round(result.climbLimitWeightKg / 1000)} t`);
  console.log(`LIMITING FACTOR: ${result.limitingFactor}`);
  console.log(`WARNINGS: ${result.warnings.length ? result.warnings.join(' | ') : 'NONE'}`);
}