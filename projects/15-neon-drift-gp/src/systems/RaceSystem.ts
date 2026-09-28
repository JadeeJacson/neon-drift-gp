import * as THREE from 'three';
import type { Car } from '../entities/Car';
import type { Track } from '../entities/Track';

export type RacePhase = 'countdown' | 'racing' | 'finished';

export type RaceState = {
  phase: RacePhase;
  countdown: number;
  totalLaps: number;
  raceTime: number;
  playerLap: number;
  playerPosition: number;
  standings: {
    index: number;
    name: string;
    isPlayer: boolean;
    lap: number;
    progress: number;
    finished: boolean;
    bestLap: number;
    paint: string;
  }[];
  playerBestLap: number;
  playerLastLap: number;
  message: string;
};

export class RaceSystem {
  phase: RacePhase = 'countdown';
  totalLaps = 3;
  countdown = 3.5;
  raceTime = 0;
  private message = '';
  private messageTimer = 0;
  private readonly aiTargets = new Map<number, { lateral: number; aggression: number; boostAt: number }>();

  constructor(
    private readonly track: Track,
    private readonly cars: Car[],
    totalLaps = 3,
  ) {
    this.totalLaps = totalLaps;
    const laterals = [-4.5, 4.5, -4.5];
    cars.forEach((car, i) => {
      if (car.isPlayer) return;
      this.aiTargets.set(car.index, {
        lateral: laterals[(i - 1) % laterals.length] ?? 0,
        aggression: 0.95 + (i % 3) * 0.08,
        boostAt: 0.2 + (i % 4) * 0.15,
      });
    });
  }

  reset(): void {
    this.phase = 'countdown';
    this.countdown = 3.5;
    this.raceTime = 0;
    this.message = '';
    this.messageTimer = 0;
    for (const car of this.cars) car.resetProgress();
  }

  update(dt: number): RaceState {
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.phase = 'racing';
        this.countdown = 0;
        this.flashMessage('GO!');
      }
    } else if (this.phase === 'racing') {
      this.raceTime += dt;
      this.driveAI(dt);
      for (const car of this.cars) {
        if (car.lastLap > 0 && car.lap === Math.floor(car.unwrappedProgress) && car.isPlayer) {
          // lap flash handled in Game via watching lap changes
        }
      }
      if (this.cars.every((c) => c.lap >= this.totalLaps)) {
        this.phase = 'finished';
        const player = this.cars.find((c) => c.isPlayer);
        const pos = this.getStandings().findIndex((s) => s.isPlayer) + 1;
        this.flashMessage(pos === 1 ? 'FINISH · 1st!' : `FINISH · ${ordinal(pos)}`);
        if (player) player.finished = true;
        for (const c of this.cars) c.finished = true;
      }
    }

    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = '';
    }

    // car-car collisions
    for (let i = 0; i < this.cars.length; i += 1) {
      for (let j = i + 1; j < this.cars.length; j += 1) {
        this.cars[i].resolveCarCollision(this.cars[j]);
      }
    }

    return this.getState();
  }

  private driveAI(_dt: number): void {
    void _dt;
    for (const car of this.cars) {
      if (car.isPlayer || car.finished) continue;
      const cfg = this.aiTargets.get(car.index) ?? { lateral: 0, aggression: 0.9, boostAt: 0.3 };
      const lookAhead = 0.02 + (car.speed / this.track.length) * 0.8;
      const targetU = (car.trackU + lookAhead + 1) % 1;
      const target = this.track.pointAt(targetU, cfg.lateral);
      const toTarget = target.sub(car.position);
      const desiredHeading = Math.atan2(toTarget.x, toTarget.z);
      let headingErr = desiredHeading - car.heading;
      while (headingErr > Math.PI) headingErr -= Math.PI * 2;
      while (headingErr < -Math.PI) headingErr += Math.PI * 2;

      // Positive steer now decreases heading (screen-right); invert headingErr.
      car.controls.steer = THREE.MathUtils.clamp(-headingErr * 1.8, -1, 1);

      const curvature = Math.abs(this.track.curvatureAtU(car.trackU));
      const cornerSpeed = curvature > 0.08 ? 34 / (0.5 + curvature * 8) : this.trackLengthSpeed(cfg.aggression);
      const speedRatio = car.speed / Math.max(10, cornerSpeed);
      car.controls.throttle = speedRatio < 1 ? 1 : speedRatio > 1.2 ? -0.35 : 0.7;
      car.controls.brake = speedRatio > 1.3;
      car.controls.drift = curvature > 0.1 && car.speed > 26 && headingErr * car.controls.steer > 0;
      const lapPhase = (car.unwrappedProgress % 1);
      car.controls.boost =
        car.boost > 0.32 &&
        curvature < 0.06 &&
        Math.abs(headingErr) < 0.25 &&
        (Math.abs(lapPhase - cfg.boostAt) < 0.05 || car.boost > 0.85);
    }
  }

  private trackLengthSpeed(aggression: number): number {
    // Straights ~47–49: above player cruise (42), still under boost (58).
    return 40 + aggression * 8;
  }

  getStandings(): RaceState['standings'] {
    return this.cars
      .map((car) => ({
        index: car.index,
        name: car.paint.name,
        isPlayer: car.isPlayer,
        lap: car.lap,
        progress: car.unwrappedProgress + car.trackU * 0, // lap fraction via unwrapped
        raceProgress: car.unwrappedProgress,
        finished: car.finished,
        bestLap: car.bestLap,
        paint: car.paint.body,
      }))
      .sort((a, b) => {
        if (a.finished !== b.finished) return a.finished ? -1 : 1;
        return b.raceProgress - a.raceProgress;
      })
      .map((s, i) => ({ ...s, position: i + 1 })) as RaceState['standings'];
  }

  getState(): RaceState {
    const player = this.cars.find((c) => c.isPlayer)!;
    const standings = this.getStandings();
    const pos = standings.findIndex((s) => s.isPlayer) + 1;
    return {
      phase: this.phase,
      countdown: Math.max(0, Math.ceil(this.countdown - 0.5)),
      totalLaps: this.totalLaps,
      raceTime: this.raceTime,
      playerLap: Math.min(player.lap + 1, this.totalLaps),
      playerPosition: pos,
      standings,
      playerBestLap: player.bestLap,
      playerLastLap: player.lastLap,
      message: this.message || (this.phase === 'countdown' ? String(Math.max(1, Math.ceil(this.countdown - 0.5))) : ''),
    };
  }

  flashMessage(text: string, duration = 2): void {
    this.message = text;
    this.messageTimer = duration;
  }

  getPlayerLapDelta(): { justLapped: boolean; improved: boolean } {
    // Game watches car.lap changes itself
    return { justLapped: false, improved: false };
  }
}

function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}
