importScripts('../lib/string/String.js');
importScripts('actions.js');
importScripts('ffxivcraftmodel.js');
importScripts('seededrandom.js');

self.onmessage = function(e) {
  try {
    switch (e.data.type) {
      case 'prob':
        runProbablisticSim(e.data.id, e.data.settings);
        break;
      case 'montecarlo':
        runMonteCarloSim(e.data.id, e.data.settings);
        break;
      case 'baseValues':
        calculateBaseValues(e.data.id, e.data.settings);
        break;
      default:
        console.error("unexpected message: %O", e.data);
    }
  } catch (ex) {
    console.error(ex);
    self.postMessage({
      id: e.data.id,
      error: {
        error: ex.toString()
      }
    })
  }
};

function setupSim(settings) {
  var seed = Math.seed;
  if (typeof settings.seed === 'number') {
    seed = settings.seed;
    Math.seed = seed;
  }

  var crafterActions = [];

  for (var i = 0; i < settings.crafter.actions.length; i++) {
    crafterActions.push(AllActions[settings.crafter.actions[i]]);
  }

  var crafter = new Crafter(settings.recipe.cls,
    settings.crafter.level,
    settings.crafter.craftsmanship,
    settings.crafter.control,
    settings.crafter.cp,
    crafterActions);
  var recipe = new Recipe(settings.recipe.baseLevel, settings.recipe.level, settings.recipe.difficulty,
      settings.recipe.durability, settings.recipe.startQuality, settings.recipe.maxQuality,
      settings.recipe.suggestedCraftsmanship, settings.recipe.suggestedControl,
      settings.recipe.progressDivider, settings.recipe.qualityDivider,
      settings.recipe.progressModifier, settings.recipe.qualityModifier);
  var synth = new Synth(crafter, recipe, settings.reliabilityPercent / 100.0, 0);

  var startState = NewStateFromSynth(synth);

  var sequence = [];

  for (var j = 0; j < settings.sequence.length; j++) {
    sequence.push(AllActions[settings.sequence[j]]);
  }
  return {
    seed: seed,
    synth: synth,
    startState: startState,
    sequence: sequence
  };
}

function runProbablisticSim(id, settings) {
  var sim = setupSim(settings);

  var logOutput = new LogOutput();

  logOutput.write("Probabilistic Result\n");
  logOutput.write("====================\n");

  simSynth(sim.sequence, sim.startState, false, true, settings.debug, logOutput);

  self.postMessage({
    id: id,
    success: {
      seed: sim.seed,
      sequence: settings.sequence,
      log: logOutput.log
    }
  });
}

function runMonteCarloSim(id, settings) {
  var sim = setupSim(settings);

  var logOutput = new LogOutput();

  logOutput.write('Seed: %d\n\n'.sprintf(sim.seed));

  var monteCarloSimHeader = "Monte Carlo Result of " + settings.maxMontecarloRuns + " runs";
  logOutput.write(monteCarloSimHeader + "\n");
  logOutput.write("=".repeat(monteCarloSimHeader.length));
  logOutput.write("\n");

  var mcSimResult = MonteCarloSim(sim.sequence, sim.synth, settings.maxMontecarloRuns, false, false, settings.debug, logOutput);

  var states = MonteCarloSequence(sim.sequence, sim.startState, true, false, false, logOutput);
  var finalState = states[states.length - 1];

  var violations = finalState.checkViolations();

  var result = {
    id: id,
    success: {
      seed: sim.seed,
      sequence: settings.sequence,
      log: logOutput.log,
      state: {
        quality: finalState.qualityState,
        durability: finalState.durabilityState,
        cp: finalState.cpState,
        progress: finalState.progressState,
        successPercent: mcSimResult.successPercent,
        hqPercent: hqPercentFromQuality(finalState.qualityState / settings.recipe.maxQuality * 100),
        feasible: violations.progressOk && violations.durabilityOk && violations.cpOk && violations.reliabilityOk,
        violations: violations,
        effects: finalState.effects,
        lastStep: finalState.lastStep,
        bonusMaxCp: finalState.bonusMaxCp
      }
    }
  };

  self.postMessage(result);
}

function calculateBaseValues(id, settings) {
  var sim = setupSim(settings);

  var effCrafterLevel = getEffectiveCrafterLevel(sim.synth);
  var levelDifference = effCrafterLevel - sim.synth.recipe.level;
  var baseProgress = Math.floor(sim.synth.calculateBaseProgressIncrease(levelDifference, sim.synth.crafter.craftsmanship));
  var baseQuality = Math.floor(sim.synth.calculateBaseQualityIncrease(levelDifference, sim.synth.crafter.control));

  self.postMessage({
    id: id,
    success: {
      baseValues: {
        progress: baseProgress,
        quality: baseQuality,
      },
    },
  });
}

