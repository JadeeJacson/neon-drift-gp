"use strict";
// 0.8: 触屏控制。虚拟摇杆、动作键与滑动视角；把触控翻译成既有按键/鼠标事件，不复制玩法逻辑。
let touchReady = false;
const touchOld = { init };
const touchHeld = new Set();

function touchKey(code, down) {
  window.dispatchEvent(
    new KeyboardEvent(down ? "keydown" : "keyup", {
      code,
      cancelable: true,
    }),
  );
}
function touchPress(code) {
  touchKey(code, true);
  setTimeout(() => touchKey(code, false), 60);
}

init = function () {
  touchOld.init();
  const canvas = $("game");
  const ui = document.createElement("div");
  ui.id = "touchUi";
  ui.innerHTML =
    '<div id="touchStick"><div id="touchKnob"></div></div>' +
    '<div class="touch-btns">' +
    '<button data-hold="Space" aria-label="跳跃或上升">▲</button>' +
    '<button data-hold="ControlLeft" aria-label="下降">▼</button>' +
    '<button data-tap="KeyE" aria-label="登船或出舱">E</button>' +
    '<button data-hold="KeyF" aria-label="辅助减速">F</button>' +
    "</div>" +
    '<div class="touch-mini">' +
    '<button data-tap="KeyM">星图</button><button data-tap="KeyJ">日志</button>' +
    '<button data-tap="KeyO">设置</button><button data-tap="KeyN">黑洞</button>' +
    '<button data-tap="KeyP">探针</button><button data-tap="KeyU">量子</button>' +
    "</div>";
  document.body.append(ui);

  // 虚拟摇杆 → WASD（按下方向键语义，松开全部释放）。
  const stick = $("touchStick"),
    knob = $("touchKnob");
  let stickId = null;
  const axis = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };
  function setAxis(code, on) {
    if (axis[code] === on) return;
    axis[code] = on;
    if (on && !touchHeld.has(code)) {
      touchHeld.add(code);
      touchKey(code, true);
    } else if (!on && touchHeld.has(code)) {
      touchHeld.delete(code);
      touchKey(code, false);
    }
  }
  function stickMove(e) {
    const r = stick.getBoundingClientRect(),
      dx = e.clientX - (r.left + r.width / 2),
      dy = e.clientY - (r.top + r.height / 2),
      dead = 14;
    knob.style.transform = "translate(" + dx * 0.4 + "px," + dy * 0.4 + "px)";
    setAxis("KeyW", dy < -dead);
    setAxis("KeyS", dy > dead);
    setAxis("KeyA", dx < -dead);
    setAxis("KeyD", dx > dead);
  }
  function stickEnd(e) {
    if (stickId !== null && e.pointerId !== undefined && e.pointerId !== stickId)
      return;
    stickId = null;
    knob.style.transform = "";
    setAxis("KeyW", false);
    setAxis("KeyS", false);
    setAxis("KeyA", false);
    setAxis("KeyD", false);
  }
  stick.addEventListener("pointerdown", (e) => {
    stickId = e.pointerId;
    try {
      stick.setPointerCapture(e.pointerId);
    } catch (err) {}
    stickMove(e);
    e.preventDefault();
  });
  stick.addEventListener("pointermove", (e) => {
    if (stickId === e.pointerId) stickMove(e);
  });
  stick.addEventListener("pointerup", stickEnd);
  stick.addEventListener("pointercancel", stickEnd);

  // 动作键：hold 类保持按下，tap 类瞬时触发。
  ui.querySelectorAll("button").forEach((btn) => {
    const hold = btn.dataset.hold,
      tap = btn.dataset.tap,
      code = hold || tap;
    let down = false;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (tap) {
        touchPress(tap);
        return;
      }
      down = true;
      touchHeld.add(hold);
      touchKey(hold, true);
    });
    const release = () => {
      if (!down) return;
      down = false;
      touchHeld.delete(code);
      touchKey(code, false);
    };
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);
  });

  // 滑动视角：合成带 movementX/Y 的 mousemove，沿用游戏现有视角逻辑。
  let lookId = null,
    lastX = 0,
    lastY = 0;
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (lookId !== null) return;
      lookId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      drag = true;
    },
    { passive: true },
  );
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerId !== lookId) return;
      const dx = Math.max(-80, Math.min(80, e.clientX - lastX)),
        dy = Math.max(-80, Math.min(80, e.clientY - lastY));
      lastX = e.clientX;
      lastY = e.clientY;
      const ev = new MouseEvent("mousemove", { cancelable: true });
      Object.defineProperty(ev, "movementX", { value: dx });
      Object.defineProperty(ev, "movementY", { value: dy });
      document.dispatchEvent(ev);
    },
    { passive: true },
  );
  const lookEnd = (e) => {
    if (e.pointerId !== lookId) return;
    lookId = null;
    drag = false;
  };
  window.addEventListener("pointerup", lookEnd);
  window.addEventListener("pointercancel", lookEnd);

  const enable = () => document.body.classList.add("touch");
  if (matchMedia("(pointer: coarse)").matches) enable();
  window.addEventListener(
    "touchstart",
    () => {
      enable();
    },
    { once: true, passive: true },
  );
  touchReady = true;
  void canvas;
};
