//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitFltOpsPageProps } from '../../OIT';
import {
  A380TakeoffPerformanceInput,
  calculateA380TakeoffPerformance,
} from './TakeoffPerformanceCalculator';

interface OitFltOpsPerformancePageProps extends AbstractOitFltOpsPageProps {}

export class OitFltOpsPerformance extends DisplayComponent<OitFltOpsPerformancePageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly input: A380TakeoffPerformanceInput = {
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
  };

  private readonly result = calculateA380TakeoffPerformance(this.input);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subs) {
      s.destroy();
    }

    super.destroy();
  }

  private renderInputRow(label: string, value: string): VNode {
    return (
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div class="oit-label" style="font-size: 24px;">{label}</div>
        <div class="oit-label green" style="font-size: 24px;">{value}</div>
      </div>
    );
  }

  private renderOutputRow(label: string, value: string, amber = false): VNode {
    return (
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div class="oit-label" style="font-size: 26px;">{label}</div>
        <div class={`oit-label ${amber ? 'amber' : 'green'}`} style="font-size: 30px;">{value}</div>
      </div>
    );
  }

  render(): VNode {
    const input = this.input;
    const result = this.result;

    return (
      <>
        {/* begin page content */}
        <div class="oit-page-container framed" style="padding: 30px; gap: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="oit-label" style="font-size: 34px;">A380 TAKEOFF PERFORMANCE</div>
            <div class={`oit-label ${result.status === 'T.O POSSIBLE' ? 'green' : 'amber'}`} style="font-size: 30px;">
              {result.status}
            </div>
          </div>

          <div style="display: flex; gap: 40px; width: 100%;">
            <div style="width: 42%;">
              <div class="oit-label cyan" style="font-size: 28px; margin-bottom: 20px;">INPUT DATA</div>

              {this.renderInputRow('AIRPORT', input.airport)}
              {this.renderInputRow('RUNWAY', input.runway)}
              {this.renderInputRow('TOW', `${Math.round(input.towKg / 1000)} T`)}
              {this.renderInputRow('CG', `${input.cgPercentMac.toFixed(1)} %`)}
              {this.renderInputRow('CONF', input.flapConfig)}
              {this.renderInputRow('OAT', `${input.oatC} °C`)}
              {this.renderInputRow('QNH', `${input.qnhHpa} HPA`)}
              {this.renderInputRow('WIND', `${input.windDirectionDeg}/${input.windSpeedKt}`)}
              {this.renderInputRow('RWY COND', input.runwayCondition)}
              {this.renderInputRow('PACKS', input.packsOn ? 'ON' : 'OFF')}
              {this.renderInputRow('A/I', input.antiIce)}
              {this.renderInputRow('THRUST', input.thrustMode)}
            </div>

            <div style="width: 58%;">
              <div class="oit-label cyan" style="font-size: 28px; margin-bottom: 20px;">COMPUTED RESULT</div>

              {this.renderOutputRow('V1', `${result.v1}`)}
              {this.renderOutputRow('VR', `${result.vr}`)}
              {this.renderOutputRow('V2', `${result.v2}`)}
              {this.renderOutputRow('FLEX', result.flexTempC === null ? 'TOGA' : `${result.flexTempC} °C`)}
              {this.renderOutputRow('THS', result.ths)}
              {this.renderOutputRow('REQ DIST', `${result.requiredDistanceM} M`)}
              {this.renderOutputRow('RWY MARGIN', `${result.runwayMarginM} M`, result.runwayMarginM < 500)}
              {this.renderOutputRow('FIELD LIM WT', `${Math.round(result.fieldLimitWeightKg / 1000)} T`)}
              {this.renderOutputRow('CLB LIM WT', `${Math.round(result.climbLimitWeightKg / 1000)} T`)}
              {this.renderOutputRow('LIMITING', result.limitingFactor, result.limitingFactor !== 'NONE')}
            </div>
          </div>

          <div style="width: 100%; margin-top: 10px;">
            <div class="oit-label cyan" style="font-size: 26px; margin-bottom: 10px;">MESSAGES</div>
            {result.warnings.length === 0 ? (
              <div class="oit-label green" style="font-size: 24px;">NO PERFORMANCE WARNINGS</div>
            ) : (
              result.warnings.map((warning) => (
                <div class="oit-label amber" style="font-size: 24px; margin-bottom: 6px;">{warning}</div>
              ))
            )}
          </div>

          <div class="oit-label amber" style="font-size: 18px; align-self: flex-end;">
            SIMULATION PERFORMANCE MODEL - NOT FOR REAL WORLD USE
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}