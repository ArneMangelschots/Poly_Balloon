const MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
const GOOD_ENOUGH_CORRELATION = 0.9;

const autoCorrelate = (buf, sampleRate) => {

  const SIZE = buf.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = - 1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  const correlations = new Array(MAX_SAMPLES);

  for (let i = 0;i < SIZE;i ++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) // not enough signal
    return - 1;

  let lastCorrelation = 1;
  for (let offset = MIN_SAMPLES;offset < MAX_SAMPLES;offset ++) {
    let correlation = 0;

    for (let i = 0;i < MAX_SAMPLES;i ++) {
      correlation += Math.abs((buf[i]) - (buf[i + offset]));
    }
    correlation = 1 - (correlation / MAX_SAMPLES);
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
          // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
          // Now we need to tweak the offset - by interpolating between the values to the left and right of the
          // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
          // we need to do a curve fit on correlations[] around bestOffset in order to better determine precise
          // (anti-aliased) offset.

          // we know bestOffset >=1,
          // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
          // we can't drop into this clause until the following pass (else if).
      const shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];
      return sampleRate / (bestOffset + (8 * shift));
    }
    lastCorrelation = correlation;
  }
  if (bestCorrelation > 0.01) {
        // console.log("f = " + sampleRate/bestOffset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate / bestOffset;
  }
  return - 1;
    //	const best_frequency = sampleRate/best_offset;
};

export default autoCorrelate;
