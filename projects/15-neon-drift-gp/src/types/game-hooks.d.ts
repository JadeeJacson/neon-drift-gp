export type ThreeGameDiagnostics = {
  frame: number;
  elapsed: number;
  score: number;
  targetScore: number;
  complete: boolean;
  player: {
    position: { x: number; y: number; z: number };
    speed: number;
    drifting?: boolean;
    boost?: number;
  };
  renderer: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  canvas: {
    clientWidth: number;
    clientHeight: number;
    width: number;
    height: number;
    dpr: number;
  };
};

export type ThreeGameTestHooks = {
  seed: (value: number) => void;
  setState: (name: string) => { state: string };
  setPausedForScreenshot: (paused: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  hideDebugUi: (hidden: boolean) => void;
};

declare global {
  interface Window {
    __THREE_GAME_DIAGNOSTICS__?: ThreeGameDiagnostics;
    __THREE_GAME_TEST_HOOKS__?: ThreeGameTestHooks;
  }
}

export {};
