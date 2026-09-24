/**
 * anime.js (Anime v3 Lightweight ESM Engine)
 * High-performance JavaScript animation engine for interactive UI micro-animations,
 * staggered card entrances, state diff highlights, and replay scrubber transitions.
 */

// Default animation configuration
const defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0
};

const defaultTweenSettings = {
  duration: 1000,
  delay: 0,
  endDelay: 0,
  easing: 'easeOutElastic(1, .5)',
  round: 0
};

const validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

// Helper utilities
function isSvg(el) {
  return window.SVGElement && el instanceof SVGElement;
}

function isDom(el) {
  return el.nodeType || isSvg(el);
}

function toArray(o) {
  if (Array.isArray(o)) return o;
  if (typeof o === 'string') return Array.from(document.querySelectorAll(o));
  if (o && o.length !== undefined && !isDom(o) && typeof o !== 'string') return Array.from(o);
  return [o];
}

// Built-in Easing Curves
const bezier = (function() {
  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C(aA1) { return 3.0 * aA1; }

  function calcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
  }

  function getSlope(aT, aA1, aA2) {
    return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
  }

  return function(mX1, mY1, mX2, mY2) {
    return function(t) {
      if (mX1 === mY1 && mX2 === mY2) return t;
      if (t === 0) return 0;
      if (t === 1) return 1;
      let guessT = t;
      for (let i = 0; i < 4; ++i) {
        const currentSlope = getSlope(guessT, mX1, mX2);
        if (currentSlope === 0.0) return guessT;
        const currentX = calcBezier(guessT, mX1, mX2) - t;
        guessT -= currentX / currentSlope;
      }
      return calcBezier(guessT, mY1, mY2);
    };
  };
})();

const easings = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - --t * t * t * t,
  easeInOutQuart: t => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),
  easeInExpo: t => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: t => (t === 1 ? 1 : -Math.pow(2, -10 * t) + 1),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if ((t /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
    return 0.5 * (-Math.pow(2, -10 * --t) + 2);
  },
  easeOutBack: (t, s = 1.70158) => --t * t * ((s + 1) * t + s) + 1,
  easeOutElastic: (t, m = 1, p = 0.5) => {
    if (t === 0 || t === 1) return t;
    const s = (p / (2 * Math.PI)) * Math.asin(1 / m);
    return m * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },
  spring: (mass = 1, stiffness = 100, damping = 10, velocity = 0) => {
    const w0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
    const b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;
    return t => {
      if (t === 0 || t === 1) return t;
      let progress;
      if (zeta < 1) {
        progress = Math.exp(-t * zeta * w0) * (1 * Math.cos(wd * t) + b * Math.sin(wd * t));
      } else {
        progress = (1 + b * t) * Math.exp(-t * w0);
      }
      return 1 - progress;
    };
  }
};

function parseEasing(val) {
  if (typeof val === 'function') return val;
  if (easings[val]) return easings[val];
  if (val && val.startsWith('cubicBezier')) {
    const match = val.match(/cubicBezier\(([^)]+)\)/);
    if (match) {
      const p = match[1].split(',').map(Number);
      return bezier(p[0], p[1], p[2], p[3]);
    }
  }
  if (val && val.startsWith('spring')) {
    const match = val.match(/spring\(([^)]+)\)/);
    if (match) {
      const p = match[1].split(',').map(Number);
      return easings.spring(p[0], p[1], p[2], p[3]);
    }
    return easings.spring();
  }
  return easings.easeOutExpo;
}

// Active animations registry for cancellation / coordination
const activeAnimations = new Set();

/**
 * Main Anime function
 */
export function anime(params = {}) {
  const targets = toArray(params.targets || []);
  if (targets.length === 0) return { pause: () => {}, play: () => {}, restart: () => {} };

  const duration = typeof params.duration === 'number' ? params.duration : defaultTweenSettings.duration;
  const easingFn = parseEasing(params.easing || defaultTweenSettings.easing);
  const loop = params.loop || 1;
  const delayParam = params.delay || 0;
  const direction = params.direction || 'normal';

  let startTime = null;
  let rafId = null;
  let isPaused = false;
  let isCompleted = false;

  // Extract animated properties
  const animatedProps = [];
  const reservedKeys = ['targets', 'duration', 'delay', 'endDelay', 'easing', 'direction', 'loop', 'autoplay', 'begin', 'update', 'complete', 'change'];

  for (const key of Object.keys(params)) {
    if (!reservedKeys.includes(key)) {
      animatedProps.push({
        name: key,
        value: params[key]
      });
    }
  }

  // Pre-calculate initial and target values for each target element
  const targetData = targets.map((el, targetIndex) => {
    if (!el) return null;
    const targetDelay = typeof delayParam === 'function' ? delayParam(el, targetIndex, targets.length) : delayParam;

    const propTweens = animatedProps.map(prop => {
      const isTransform = validTransforms.includes(prop.name);
      let fromVal, toVal, unit = '';

      let rawVal = prop.value;
      if (typeof rawVal === 'function') {
        rawVal = rawVal(el, targetIndex, targets.length);
      }

      if (Array.isArray(rawVal)) {
        fromVal = rawVal[0];
        toVal = rawVal[1];
      } else {
        toVal = rawVal;
        // Read current inline or computed style
        if (isDom(el)) {
          const style = isTransform ? '' : window.getComputedStyle(el)[prop.name];
          fromVal = style || (prop.name.includes('opacity') ? 1 : 0);
        } else {
          fromVal = el[prop.name] || 0;
        }
      }

      // Parse unit if present (px, %, deg, em, rem)
      if (typeof toVal === 'string') {
        const unitMatch = toVal.match(/(-?[\d.]+)([a-z%]*)/i);
        if (unitMatch) {
          toVal = parseFloat(unitMatch[1]);
          unit = unitMatch[2] || '';
        }
      }
      if (typeof fromVal === 'string') {
        const fromMatch = fromVal.match(/(-?[\d.]+)/);
        fromVal = fromMatch ? parseFloat(fromMatch[1]) : 0;
      }

      return {
        name: prop.name,
        isTransform,
        from: Number(fromVal) || 0,
        to: Number(toVal) || 0,
        unit
      };
    });

    return {
      el,
      delay: targetDelay,
      tweens: propTweens
    };
  }).filter(Boolean);

  let hasBegun = false;

  function tick(timestamp) {
    if (isPaused) return;
    if (!startTime) startTime = timestamp;

    const elapsedTotal = timestamp - startTime;
    let allFinished = true;

    if (!hasBegun && params.begin) {
      params.begin({ targets, duration });
      hasBegun = true;
    }

    for (const tData of targetData) {
      const { el, delay, tweens } = tData;
      const targetElapsed = Math.max(0, elapsedTotal - delay);
      const progress = Math.min(1, targetElapsed / duration);
      const easedProgress = easingFn(progress);

      if (progress < 1) {
        allFinished = false;
      }

      const transforms = {};

      for (const tween of tweens) {
        const currentVal = tween.from + (tween.to - tween.from) * easedProgress;

        if (isDom(el)) {
          if (tween.isTransform) {
            transforms[tween.name] = `${currentVal}${tween.unit || (tween.name.includes('rotate') ? 'deg' : tween.name.includes('scale') ? '' : 'px')}`;
          } else {
            el.style[tween.name] = `${currentVal}${tween.unit}`;
          }
        } else {
          el[tween.name] = currentVal;
        }
      }

      if (Object.keys(transforms).length > 0 && isDom(el)) {
        const transformStr = Object.entries(transforms)
          .map(([k, v]) => `${k}(${v})`)
          .join(' ');
        el.style.transform = transformStr;
      }
    }

    if (params.update) {
      params.update({ progress: Math.min(1, elapsedTotal / duration) });
    }

    if (!allFinished) {
      rafId = requestAnimationFrame(tick);
    } else {
      isCompleted = true;
      activeAnimations.delete(instance);
      if (params.complete) {
        params.complete({ targets });
      }
    }
  }

  const instance = {
    play: () => {
      if (isPaused) {
        isPaused = false;
        startTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    },
    pause: () => {
      isPaused = true;
      if (rafId) cancelAnimationFrame(rafId);
    },
    restart: () => {
      startTime = null;
      isPaused = false;
      isCompleted = false;
      rafId = requestAnimationFrame(tick);
    },
    cancel: () => {
      isPaused = true;
      if (rafId) cancelAnimationFrame(rafId);
      activeAnimations.delete(instance);
    }
  };

  activeAnimations.add(instance);

  if (params.autoplay !== false) {
    rafId = requestAnimationFrame(tick);
  }

  return instance;
}

/**
 * Helper: Stagger animation delay generator
 * @param {number} val - Milliseconds between each target
 * @param {object} [opts] - Options { start: 0, from: 'first'|'last'|'center' }
 */
anime.stagger = function(val, opts = {}) {
  const start = opts.start || 0;
  const from = opts.from || 'first';
  const direction = opts.direction || 'normal';

  return function(el, i, length) {
    let index = i;
    if (from === 'last') index = length - 1 - i;
    if (from === 'center') index = Math.abs(Math.floor(length / 2) - i);
    if (direction === 'reverse') index = length - 1 - index;
    return start + val * index;
  };
};

/**
 * Helper: Create sequence timeline
 */
anime.timeline = function(tlParams = {}) {
  const queue = [];
  let currentOffset = 0;

  return {
    add: function(animParams, offset = '+=0') {
      let delayOffset = 0;
      if (typeof offset === 'number') delayOffset = offset;
      else if (typeof offset === 'string' && offset.startsWith('+=')) {
        delayOffset = currentOffset + (parseFloat(offset.slice(2)) || 0);
      } else if (typeof offset === 'string' && offset.startsWith('-=')) {
        delayOffset = Math.max(0, currentOffset - (parseFloat(offset.slice(2)) || 0));
      }

      const dur = animParams.duration || defaultTweenSettings.duration;
      currentOffset = delayOffset + dur;

      setTimeout(() => {
        anime({ ...tlParams, ...animParams, delay: (animParams.delay || 0) + delayOffset });
      }, delayOffset);

      return this;
    }
  };
};

/**
 * Remove element animations
 */
anime.remove = function(targets) {
  const els = toArray(targets);
  for (const anim of activeAnimations) {
    anim.cancel();
  }
};

export default anime;
