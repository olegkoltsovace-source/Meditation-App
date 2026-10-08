// The breathing timeline. Plain functions, no Three.js: given a pattern and a time,
// they tell you which step you're in and how full the lungs are.

const smoothInOut = (value) => value * value * (3 - 2 * value); // slow start, slow end

export const cycleLengthSeconds = (pattern) => pattern.steps.reduce((total, step) => total + step.seconds, 0);

// Which step of the pattern is happening `secondsIntoSession` seconds after pressing play?
export const findCurrentStep = (pattern, secondsIntoSession) => {
  let secondsIntoCycle = secondsIntoSession % cycleLengthSeconds(pattern);

  for (let stepIndex = 0; stepIndex < pattern.steps.length; stepIndex++) {
    const step = pattern.steps[stepIndex];
    if (secondsIntoCycle < step.seconds) {
      return {
        step,
        stepIndex,
        progress: secondsIntoCycle / step.seconds, // 0 = step just started, 1 = step ending
        secondsLeft: step.seconds - secondsIntoCycle,
      };
    }
    secondsIntoCycle -= step.seconds;
  }

  const firstStep = pattern.steps[0];
  return { step: firstStep, stepIndex: 0, progress: 0, secondsLeft: firstStep.seconds };
};

// How full the lungs are (0 = empty, 1 = full) at this point of a step
export const breathFullness = (phase, progress) => {
  if (phase === "inhale") return smoothInOut(progress);
  if (phase === "exhale") return 1 - smoothInOut(progress);
  if (phase === "hold") return 1;
  return 0; // rest
};
