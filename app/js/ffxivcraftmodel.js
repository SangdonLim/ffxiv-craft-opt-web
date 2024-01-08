//require('./String.js');
/* Adding new actions search for STEP_##
    * Add action to AllActions object STEP_01
    * Add action effect to ApplySpecialActionEffects STEP_02
    * Add action counter to UpdateEffectCounters STEP_03
*/

/* ToDo
    * Implement Heavensward actions
 */

function LogOutput() {
  this.log = '';
}

LogOutput.prototype.write = function (s) {
  this.log += s;
};

LogOutput.prototype.clear = function () {
  this.log = '';
};

function Logger(logOutput) {
    this.logOutput = logOutput;
}

Logger.prototype.log = function(myString) {
    var args = Array.prototype.slice.call(arguments, 1);
    var msg = String.prototype.sprintf.apply(myString, args);
    if (this.logOutput !== undefined && this.logOutput !== null) {
        this.logOutput.write(msg + '\n');
    }
    else {
        console.log(msg);
    }
};

function Crafter(cls, level, craftsmanship, control, craftPoints, specialist, actions) {
    this.cls = cls;
    this.craftsmanship = craftsmanship;
    this.control = control;
    this.craftPoints = craftPoints;
    this.level = level;
    this.specialist = specialist;
    if (actions === null) {
        this.actions = [];
    }
    else {
        this.actions = actions;
    }
}

function Recipe(baseLevel, level, difficulty, durability, startQuality, maxQuality, suggestedCraftsmanship, suggestedControl, progressDivider, qualityDivider, progressModifier, qualityModifier) {
    this.baseLevel = baseLevel;
    this.level = level;
    this.difficulty = difficulty;
    this.durability = durability;
    this.startQuality = startQuality;
    this.maxQuality = maxQuality;
    this.suggestedCraftsmanship = suggestedCraftsmanship;
    this.suggestedControl = suggestedControl;
    this.progressDivider = progressDivider || 100;
    this.qualityDivider = qualityDivider || 100;
    this.progressModifier = progressModifier || 100;
    this.qualityModifier = qualityModifier || 100;
}

function Synth(crafter, recipe, reliabilityIndex, maxLength) {
    this.crafter = crafter;
    this.recipe = recipe;
    this.reliabilityIndex = reliabilityIndex;
    this.maxLength = maxLength;
}

Synth.prototype.calculateBaseProgressIncrease = function (levelDifference, craftsmanship) {
    var levelDifferenceFactor = levelDifference > 0 ? 1.0 : (this.recipe.progressModifier * Math.fround(0.01));
    return Math.floor(Math.fround(((this.crafter.craftsmanship * 10.0) / this.recipe.progressDivider + 2.0) * levelDifferenceFactor))
};

Synth.prototype.calculateBaseQualityIncrease = function (levelDifference, control) {
    var levelDifferenceFactor = levelDifference > 0 ? 1.0 : (this.recipe.qualityModifier * Math.fround(0.01));
    return Math.floor(Math.fround(((this.crafter.control * 10.0) / this.recipe.qualityDivider + 35.0) * levelDifferenceFactor))
};

function isActionEq(action1, action2) {
    return action1.shortName === action2.shortName;
}

function isActionNe(action1, action2) {
    return action1.shortName !== action2.shortName;
}

function EffectTracker() {
    this.countUps = {};
    this.countDowns = {};
}

function State(synth, step, lastStep, action, durabilityState, cpState, bonusMaxCp, qualityState, progressState, wastedActions, buffUses, reliability, effects, touchCombo) {
    this.synth = synth;
    this.step = step;
    this.lastStep = lastStep;
    this.action = action;   // the action leading to this State
    this.durabilityState = durabilityState;
    this.cpState = cpState;
    this.bonusMaxCp = bonusMaxCp;
    this.qualityState = qualityState;
    this.progressState = progressState;
    this.wastedActions = wastedActions;
    this.buffUses = buffUses;
    this.reliability = reliability;
    this.effects = effects;
    this.touchCombo = touchCombo;

    // Internal state variables set after each step.
    this.iqCnt = 0;
    this.control = 0;
    this.qualityGain = 0;
    this.bProgressGain = 0;
    this.bQualityGain = 0;
    this.success = 0;
}

State.prototype.clone = function () {
    return new State(this.synth, this.step, this.lastStep, this.action, this.durabilityState, this.cpState, this.bonusMaxCp, this.qualityState, this.progressState, this.wastedActions, this.buffUses, this.reliability, clone(this.effects), this.touchCombo);
};

State.prototype.checkViolations = function () {
    // Check for feasibility violations
    var progressOk = false;
    var cpOk = false;
    var durabilityOk = false;
    var reliabilityOk = false;

    if (this.progressState >= this.synth.recipe.difficulty) {
        progressOk = true;
    }

    if (this.cpState >= 0) {
        cpOk = true;
    }

    // Consider removing sanity check in UpdateState
    if ((this.durabilityState >= 0) && (this.progressState >= this.synth.recipe.difficulty)) {
        durabilityOk = true;
    }

    if (this.reliability >= this.synth.reliabilityIndex) {
        reliabilityOk = true;
    }

    return {
        progressOk: progressOk,
        cpOk: cpOk,
        durabilityOk: durabilityOk,
        reliabilityOk: reliabilityOk
    };
};

function NewStateFromSynth(synth) {
    var step = 0;
    var lastStep = 0;
    var durabilityState = synth.recipe.durability;
    var cpState = synth.crafter.craftPoints;
    var bonusMaxCp = 0;
    var qualityState = synth.recipe.startQuality;
    var progressState = 0;
    var wastedActions = 0;
    var buffUses = 0;
    var reliability = 1;
    var effects = new EffectTracker();

    return new State(synth, step, lastStep, '', durabilityState, cpState, bonusMaxCp, qualityState, progressState, wastedActions, buffUses, reliability, effects);
}

function getEffectiveCrafterLevel(synth) {
    var effCrafterLevel = synth.crafter.level;
    if (LevelTable[synth.crafter.level]) {
        effCrafterLevel = LevelTable[synth.crafter.level];
    }
    return effCrafterLevel;
}

function ApplyModifiers(s, action) {

    // Effect Modifiers
    //=================
    var craftsmanship = s.synth.crafter.craftsmanship;
    var control = s.synth.crafter.control;
    var cpCost = action.cpCost;
    var actionProgress = action.progressIncreaseMultiplier
    var actionQuality = action.qualityIncreaseMultiplier
    var touchCombo = false

    // Effects modifying level difference
    var effCrafterLevel = getEffectiveCrafterLevel(s.synth);
    var effRecipeLevel = s.synth.recipe.level;
    var levelDifference = effCrafterLevel - effRecipeLevel;
    var pureLevelDifference = s.synth.crafter.level - s.synth.recipe.baseLevel;
    var recipeLevel = effRecipeLevel;
    var stars = s.synth.recipe.stars;

    // Effects modfiying probability
    var successProbability = action.successProbability;
    if (s.action === AllActions.observe.shortName) {
        if (isActionEq(action, AllActions.focusedSynthesis) || isActionEq(action, AllActions.focusedTouch)) {
            successProbability = 1.0;
        }
        else
        {
            s.wastedActions += 1;
        }
    }
    successProbability = Math.min(successProbability, 1);

    // Standard touch combo
    if (isActionEq(action, AllActions.standardTouch)) {
        if (s.action === AllActions.basicTouch.shortName) {
            cpCost = 18;
            touchCombo = true;
        }
    }

    // Advanced touch combo
    if (s.touchCombo && isActionEq(action, AllActions.advancedTouch)) {
        if (s.action === AllActions.standardTouch.shortName) {
            cpCost = 18;
        }
    }

    if (isActionEq(action, AllActions.groundwork) && s.synth.crafter.level >= 86) {
        actionProgress = 3.6;
    }

    if (isActionEq(action, AllActions.carefulSynthesis) && s.synth.crafter.level >= 82) {
        actionProgress = 1.8;
    }

    if (isActionEq(action, AllActions.muscleMemory)) {
        if (s.step !== 1) {
            s.wastedActions += 1;
            actionProgress = 0;
        }
    }
    if (isActionEq(action, AllActions.reflect)) {
        if (s.step !== 1) {
            s.wastedActions += 1;
            actionQuality = 0;
        }
    }

    if (isActionEq(action, AllActions.trainedFinesse)) {
        if (s.effects.countUps['innerQuiet'] !== 10) {
            s.wastedActions += 1;
            actionQuality = 0;
        }
    }

    // Effects modifying durability cost
    var durabilityCost = action.durabilityCost;
    if ((AllActions.wasteNot.shortName in s.effects.countDowns) || (AllActions.wasteNot2.shortName in s.effects.countDowns)) {
        if (isActionEq(action, AllActions.prudentTouch)) {
            actionQuality = 0;
        }
        else if (isActionEq(action, AllActions.prudentSynthesis)) {
            actionProgress = 0;
        }
        else {
            durabilityCost *= 0.5;
        }
    }

    // Effects modifying progress increase multiplier
    var progressIncreaseMultiplier = 1;

    if ((action.progressIncreaseMultiplier > 0) && (s.effects.countDowns.hasOwnProperty(AllActions.muscleMemory.shortName))){
        progressIncreaseMultiplier += 1;
        delete s.effects.countDowns[AllActions.muscleMemory.shortName];
    }

    if (AllActions.veneration.shortName in s.effects.countDowns) {
        progressIncreaseMultiplier += 0.5;
    }

	if (isActionEq(action, AllActions.groundwork) && s.durabilityState < durabilityCost) {
        progressIncreaseMultiplier *= 0.5;
    }

    // Base quality multiplier
    var qualityBaseMultipler = 1;

    if (('innerQuiet' in s.effects.countUps)) {
        qualityBaseMultipler += (0.1 * s.effects.countUps['innerQuiet']);
    }

    // Effects modifying quality increase multiplier
    var qualityIncreaseMultiplier = 1;

    if ((AllActions.greatStrides.shortName in s.effects.countDowns) && (qualityIncreaseMultiplier > 0)) {
        qualityIncreaseMultiplier += 1;
    }

    if (AllActions.innovation.shortName in s.effects.countDowns) {
        qualityIncreaseMultiplier += 0.5;
    }

    // We can only use Byregot actions when we have at least 2 stacks of inner quiet
    if (isActionEq(action, AllActions.byregotsBlessing)) {
        if (('innerQuiet' in s.effects.countUps) && s.effects.countUps['innerQuiet'] > 0) {
            qualityIncreaseMultiplier *= 1 + (0.2 * s.effects.countUps['innerQuiet']);
        } else {
            qualityIncreaseMultiplier = 0;
        }
    }

    qualityIncreaseMultiplier *= qualityBaseMultipler;

    // Calculate base and modified progress gain
    var bProgressGain = s.synth.calculateBaseProgressIncrease(levelDifference, craftsmanship);
    bProgressGain = bProgressGain * Math.fround(actionProgress * progressIncreaseMultiplier);
    bProgressGain = Math.floor(Math.fround(bProgressGain))

    // Calculate base and modified quality gain
    var bQualityGain = s.synth.calculateBaseQualityIncrease(levelDifference, control);
    bQualityGain = bQualityGain * Math.fround(actionQuality * qualityIncreaseMultiplier);
    bQualityGain = Math.floor(Math.fround(bQualityGain))

    // Effects modifying quality gain directly
    if (isActionEq(action, AllActions.trainedEye)) {
        if ((s.step === 1) && (pureLevelDifference >= 10))  {
            bQualityGain = s.synth.recipe.maxQuality;
        }
        else {
            s.wastedActions += 1;
            bQualityGain = 0;
            cpCost = 0;
        }
    }

    return {
        craftsmanship: craftsmanship,
        control: control,
        effCrafterLevel: effCrafterLevel,
        effRecipeLevel: effRecipeLevel,
        levelDifference: levelDifference,
        successProbability: successProbability,
        qualityIncreaseMultiplier: qualityIncreaseMultiplier,
        bProgressGain: bProgressGain,
        bQualityGain: bQualityGain,
        touchCombo: touchCombo,
        durabilityCost: durabilityCost,
        cpCost: cpCost
    };
}

function ApplySpecialActionEffects(s, action) {
    // STEP_02
    // Effect management
    //==================================
    // Special Effect Actions
    if (isActionEq(action, AllActions.mastersMend)) {
        s.durabilityState += 30;
    }

    if ((AllActions.manipulation.shortName in s.effects.countDowns) && (s.durabilityState > 0) && !isActionEq(action, AllActions.manipulation)) {
        s.durabilityState += 5;
    }

    if (isActionEq(action, AllActions.byregotsBlessing)) {
        if ('innerQuiet' in s.effects.countUps) {
            delete s.effects.countUps['innerQuiet'];
        }
        else {
            s.wastedActions += 1;
        }
    }

    if (isActionEq(action, AllActions.reflect)) {
        if (s.step == 1) {
            s.effects.countUps['innerQuiet'] = 1;
        } else {
            s.wastedActions += 1;
        }
    }

    if ((action.qualityIncreaseMultiplier > 0) && (AllActions.greatStrides.shortName in s.effects.countDowns)) {
        delete s.effects.countDowns[AllActions.greatStrides.shortName];
    }

    if (isActionEq(action, AllActions.veneration.shortName) && (AllActions.veneration.shortName in s.effects.countDowns)) {
        s.wastedActions += 1
    }
    if (isActionEq(action, AllActions.innovation.shortName) && (AllActions.innovation.shortName in s.effects.countDowns)) {
        s.wastedActions += 1
    }

    if (action.isBuff) {
        s.buffUses += 1
    }

}

function UpdateEffectCounters(s, action, successProbability, qualityGain) {
    // STEP_03
    // Countdown / Countup Management
    //===============================
    // Decrement countdowns
    for (var countDown in s.effects.countDowns) {
        s.effects.countDowns[countDown] -= 1;

        if (s.effects.countDowns[countDown] === 0) {
            delete s.effects.countDowns[countDown];
        }
    }

    // Increment all other inner quiet count ups
    if (qualityGain > 0 && !isActionEq(action, AllActions.byregotsBlessing)) {
        s.effects.countUps['innerQuiet'] = (s.effects.countUps['innerQuiet'] || 0) + 1 * successProbability;
    }

    if ('innerQuiet' in s.effects.countUps) {
        if (isActionEq(action, AllActions.preparatoryTouch)) {
            s.effects.countUps['innerQuiet'] += 1;
        }
        // Cap inner quiet stacks at 10
        s.effects.countUps['innerQuiet'] = Math.min(s.effects.countUps['innerQuiet'], 10);
    }

    // Initialize new effects after countdowns are managed to reset them properly
    if (action.type === 'countup') {
        s.effects.countUps[action.shortName] = 0;
    }

    if (action.type === 'countdown') {
        if (action.shortName === AllActions.muscleMemory.shortName && s.step != 1) {
            s.wastedActions += 1;
        }
        else {
            s.effects.countDowns[action.shortName] = action.activeTurns;
        }
    }
}

function UpdateState(s, action, progressGain, qualityGain, durabilityCost, cpCost, touchCombo, successProbability) {
    // State tracking
    s.progressState += progressGain;
    s.qualityState += qualityGain;
    s.durabilityState -= durabilityCost;
    s.cpState -= cpCost;
    s.lastStep += 1;

    ApplySpecialActionEffects(s, action);
    UpdateEffectCounters(s, action, successProbability, qualityGain);

    // Sanity checks for state variables
    if ((s.durabilityState >= -5) && (s.progressState >= s.synth.recipe.difficulty)) {
        s.durabilityState = 0;
    }
    s.durabilityState = Math.min(s.durabilityState, s.synth.recipe.durability);
    s.cpState = Math.min(s.cpState, s.synth.crafter.craftPoints + s.bonusMaxCp);
    s.touchCombo = touchCombo
}

function simSynth(individual, startState, assumeSuccess, verbose, debug, logOutput) {
    verbose = verbose !== undefined ? verbose : true;
    debug = debug !== undefined ? debug : false;
    logOutput = logOutput !== undefined ? logOutput : null;

    var logger = new Logger(logOutput);

    // Clone startState to keep startState immutable
    var s = startState.clone();

    // Check for null or empty individuals
    if (individual === null || individual.length === 0) {
        return NewStateFromSynth(s.synth);
    }

    if (debug) {
        logger.log('%-2s %30s %-5s %-5s %-8s %-8s %-5s %-8s %-8s %-5s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'EQUA', 'EPRG', 'IQ', 'CTL', 'QINC', 'BPRG', 'BQUA', 'WAC');
        logger.log('%2d %30s %5.0f %5.0f %8.1f %8.1f %5.1f %8.1f %8.1f %5.0f %5.0f %5.0f', s.step, '', s.durabilityState, s.cpState, s.qualityState, s.progressState, 0, s.synth.crafter.control, 0, 0, 0, 0);
    }
    else if (verbose) {
        logger.log('%-2s %30s %-5s %-5s %-8s %-8s %-5s', '#', 'Action', 'DUR', 'CP', 'EQUA', 'EPRG', 'IQ');
        logger.log('%2d %30s %5.0f %5.0f %8.1f %8.1f %5.1f', s.step, '', s.durabilityState, s.cpState, s.qualityState, s.progressState, 0);

    }

    for (var i = 0; i < individual.length; i++) {
        var action = individual[i];

        // Occur regardless of dummy actions
        //==================================
        s.step += 1;

        // Calculate Progress, Quality and Durability gains and losses under effect of modifiers
        var r = ApplyModifiers(s, action);

        // Calculate final gains / losses
        var successProbability = r.successProbability;
        if (assumeSuccess) {
            successProbability = 1;
        }
        var progressGain = r.bProgressGain;
        if (progressGain > 0) {
            s.reliability = s.reliability * successProbability;
        }

        var qualityGain = r.bQualityGain;

        // Floor gains at final stage before calculating expected value
        progressGain = successProbability * Math.floor(Math.fround(progressGain));
        qualityGain = successProbability * Math.floor(Math.fround(qualityGain));

        // Occur if a wasted action
        //==================================
        if (((s.progressState >= s.synth.recipe.difficulty) || (s.durabilityState <= 0) || (s.cpState < 0)) && (action != AllActions.dummyAction)) {
            s.wastedActions += 1;
        }

        // Occur if not a wasted action
        //==================================
        else {

            UpdateState(s, action, progressGain, qualityGain, r.durabilityCost, r.cpCost, r.touchCombo, successProbability);

        }

        var iqCnt = 0;
        if ('innerQuiet' in s.effects.countUps) {
            iqCnt = s.effects.countUps['innerQuiet'];
        }
        if (debug) {
            logger.log('%2d %30s %5.0f %5.0f %8.1f %8.1f %5.1f %8.1f %8.1f %5.0f %5.0f %5.0f', s.step, action.name, s.durabilityState, s.cpState, s.qualityState, s.progressState, iqCnt, r.control, qualityGain, Math.floor(r.bProgressGain), Math.floor(r.bQualityGain), s.wastedActions);
        }
        else if (verbose) {
            logger.log('%2d %30s %5.0f %5.0f %8.1f %8.1f %5.1f', s.step, action.name, s.durabilityState, s.cpState, s.qualityState, s.progressState, iqCnt);
        }

        s.action = action.shortName
    }

    // Check for feasibility violations
    var chk = s.checkViolations();

    if (debug) {
        logger.log('Progress Check: %s, Durability Check: %s, CP Check: %s, Reliability Check: %s, Wasted Actions: %d', chk.progressOk, chk.durabilityOk, chk.cpOk, chk.reliabilityOk, s.wastedActions);
    }
    else if (verbose) {
        logger.log('Progress Check: %s, Durability Check: %s, CP Check: %s, Reliability Check: %s, Wasted Actions: %d', chk.progressOk, chk.durabilityOk, chk.cpOk, chk.reliabilityOk, s.wastedActions);
    }

    // Return final state
    s.action = individual[individual.length-1].shortName;
    return s;

}

function MonteCarloStep(startState, action, assumeSuccess, verbose, debug, logOutput) {
    verbose = verbose !== undefined ? verbose : true;
    debug = debug !== undefined ? debug : false;
    logOutput = logOutput !== undefined ? logOutput : null;

    var logger = new Logger(logOutput);

    // Clone startState to keep startState immutable
    var s = startState.clone();

    // Initialize counters
    s.step += 1;

    // Calculate Progress, Quality and Durability gains and losses under effect of modifiers
    var r = ApplyModifiers(s, action);

    // Success or Failure
    var success = 0;
    var successRand = Math.random();
    if (0 <= successRand && successRand <= r.successProbability) {
        success = 1;
    }

    if (assumeSuccess) {
        success = 1;
    }

    // Calculate final gains / losses
    var progressGain = success * r.bProgressGain;
    if (progressGain > 0) {
        s.reliability = s.reliability * r.successProbability;
    }

    var qualityGain = success * r.bQualityGain;

    // Floor gains at final stage before calculating expected value
    progressGain = Math.floor(progressGain);
    qualityGain = Math.floor(qualityGain);

    // Occur if a dummy action
    //==================================
    if ((s.progressState >= s.synth.recipe.difficulty || s.durabilityState <= 0 || s.cpState < 0) && action != AllActions.dummyAction) {
        s.wastedActions += 1;
    }
    // Occur if not a dummy action
    //==================================
    else {
        UpdateState(s, action, progressGain, qualityGain, r.durabilityCost, r.cpCost, r.touchCombo, success);
    }

    // Check for feasibility violations
    var chk = s.checkViolations();

    var iqCnt = 0;
    if ('innerQuiet' in s.effects.countUps) {
        iqCnt = s.effects.countUps['innerQuiet'];
    }

    // Add internal state variables for later output of best and worst cases
    s.action = action.shortName;
    s.iqCnt = iqCnt;
    s.control = r.control;
    s.qualityGain = qualityGain;
    s.bProgressGain = Math.floor(Math.fround(r.bProgressGain));
    s.bQualityGain = Math.floor(Math.fround(r.bQualityGain));
    s.success = success;

    var time = s.step *3 - s.buffUses;

    if (debug) {
        logger.log('%2d %30s %5.0f %5.0f %8.0f %8.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5d', s.step, action.name, s.durabilityState, s.cpState, s.qualityState, s.progressState, s.iqCnt, s.control, s.qualityGain, s.bProgressGain, s.bQualityGain, s.wastedActions, s.success, time);
    }
    else if (verbose) {
        logger.log('%2d %30s %5.0f %5.0f %8.0f %8.0f %5.0f %-5s %5d', s.step, action.name, s.durabilityState, s.cpState, s.qualityState, s.progressState, s.iqCnt, s.success, time);
    }

    // Return final state
    return s;

}

function MonteCarloSequence(individual, startState, assumeSuccess, verbose, debug, logOutput) {
    verbose = verbose !== undefined ? verbose : true;
    debug = debug !== undefined ? debug : false;
    logOutput = logOutput !== undefined ? logOutput : null;

    var logger = new Logger(logOutput);

    var s = startState;

    // Check for null or empty individuals
    if (individual === null || individual.length === 0) {
        return startState;
    }

    var time = s.step *3 - s.buffUses;

    if (debug) {
        logger.log('%-2s %30s %-5s %-5s %-8s %-8s %-5s %-5s %-5s %-5s %-5s %-5s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'QUA', 'PRG', 'IQ', 'CTL', 'QINC', 'BPRG', 'BQUA', 'WAC', 'S/F', 'Wait');
        logger.log('%2d %30s %5.0f %5.0f %8.0f %8.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5d', s.step, '', s.durabilityState, s.cpState, s.qualityState, s.progressState, 0, s.synth.crafter.control, 0, 0, 0, 0, '', time);
    }
    else if (verbose) {
        logger.log('%-2s %30s %-5s %-5s %-8s %-8s %-5s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'QUA', 'PRG', 'IQ', 'S/F', 'Wait');
        logger.log('%2d %30s %5.0f %5.0f %8.0f %8.0f %5.0f %5.0f %5d', s.step, '', s.durabilityState, s.cpState, s.qualityState, s.progressState, 0, 0, time);

    }

    var states = [];

    states.push(s);

    for (i=0; i < individual.length; i++) {
        var action = individual[i];
        s = MonteCarloStep(s, action, assumeSuccess, verbose, debug, logOutput);
        states.push(s);
    }

    // Check for feasibility violations
    var chk = s.checkViolations();

    if (debug) {
        logger.log('Progress Check: %s, Durability Check: %s, CP Check: %s, Reliability Check: %s, Wasted Actions: %d', chk.progressOk, chk.durabilityOk, chk.cpOk, chk.reliabilityOk, s.wastedActions);
    }
    else if (verbose) {
        logger.log('Progress Check: %s, Durability Check: %s, CP Check: %s, Reliability Check: %s, Wasted Actions: %d', chk.progressOk, chk.durabilityOk, chk.cpOk, chk.reliabilityOk, s.wastedActions);
    }

    return states;
}

function MonteCarloSim(individual, synth, nRuns, assumeSuccess, verbose, debug, logOutput) {
    verbose = verbose !== undefined ? verbose : false;
    debug = debug !== undefined ? debug : false;
    logOutput = logOutput !== undefined ? logOutput : null;

    var logger = new Logger(logOutput);

    var startState = NewStateFromSynth(synth);

    var bestSequenceStates;
    var worseSequenceStates;
    var finalStateTracker = [];
    for (var i=0; i < nRuns; i++) {
        var states = MonteCarloSequence(individual, startState, assumeSuccess, false, false, logOutput);
        var finalState = states[states.length-1];

        if (!bestSequenceStates || finalState.qualityState > bestSequenceStates[bestSequenceStates.length-1].qualityState) {
            bestSequenceStates = states;
        }

        if (!worseSequenceStates || finalState.qualityState < worseSequenceStates[worseSequenceStates.length-1].qualityState) {
            worseSequenceStates = states;
        }

        finalStateTracker.push(finalState);

        if (verbose) {
            logger.log('%2d %-20s %5d %5d %8.1f %5.1f %5d', i, 'MonteCarlo', finalState.durabilityState, finalState.cpState, finalState.qualityState, finalState.progressState, finalState.wastedActions);
        }
    }

    var avgDurability = getAverageProperty(finalStateTracker, 'durabilityState', nRuns);
    var avgCp = getAverageProperty(finalStateTracker, 'cpState', nRuns);
    var avgQuality = getAverageProperty(finalStateTracker, 'qualityState', nRuns);
    var avgProgress = getAverageProperty(finalStateTracker, 'progressState', nRuns);
    var avgHqPercent = getAverageHqPercent(finalStateTracker);
    var avgStats = {
        durability: avgDurability,
        cp: avgCp,
        quality: avgQuality,
        progress: avgProgress,
        hqPercent: avgHqPercent
    };

    var successRate = getSuccessRate(finalStateTracker);

    logger.log('%-2s %20s %-5s %-5s %-8s %-6s %-6s','', '', 'DUR', 'CP', 'QUA', 'PRG', 'HQ%');
    logger.log('%2s %-20s %5.0f %5.0f %8.1f %6.1f %6.1f', '##', 'Expected Value: ', avgDurability, avgCp, avgQuality, avgProgress, avgHqPercent);

    var mdnDurability = getMedianProperty(finalStateTracker, 'durabilityState', nRuns);
    var mdnCp = getMedianProperty(finalStateTracker, 'cpState', nRuns);
    var mdnQuality = getMedianProperty(finalStateTracker, 'qualityState', nRuns);
    var mdnProgress = getMedianProperty(finalStateTracker, 'progressState', nRuns);
    var mdnHqPercent = getMedianHqPercent(finalStateTracker);
    var mdnStats = {
        durability: mdnDurability,
        cp: mdnCp,
        quality: mdnQuality,
        progress: mdnProgress,
        hqPercent: mdnHqPercent
    };

    logger.log('%2s %-20s %5.0f %5.0f %8.1f %6.1f %6.1f', '##', 'Median Value: ', mdnDurability, mdnCp, mdnQuality, mdnProgress, mdnHqPercent   );

    var minDurability = getMinProperty(finalStateTracker, 'durabilityState');
    var minCp = getMinProperty(finalStateTracker, 'cpState');
    var minQuality = getMinProperty(finalStateTracker, 'qualityState');
    var minProgress = getMinProperty(finalStateTracker, 'progressState');
    var minQualityPercent = Math.min(synth.recipe.maxQuality, minQuality)/synth.recipe.maxQuality * 100;
    var minHqPercent = hqPercentFromQuality(minQualityPercent);
    var minStats = {
        durability: minDurability,
        cp: minCp,
        quality: minQuality,
        progress: minProgress,
        hqPercent: minHqPercent
    };

    logger.log('%2s %-20s %5.0f %5.0f %8.1f %6.1f %6.1f', '##', 'Min Value: ', minDurability, minCp, minQuality, minProgress, minHqPercent);

    var maxDurability = getMaxProperty(finalStateTracker, 'durabilityState');
    var maxCp = getMaxProperty(finalStateTracker, 'cpState');
    var maxQuality = getMaxProperty(finalStateTracker, 'qualityState');
    var maxProgress = getMaxProperty(finalStateTracker, 'progressState');
    var maxQualityPercent = Math.max(synth.recipe.maxQuality, maxQuality)/synth.recipe.maxQuality * 100;
    var maxHqPercent = hqPercentFromQuality(maxQualityPercent);
    var maxStats = {
        durability: maxDurability,
        cp: maxCp,
        quality: maxQuality,
        progress: maxProgress,
        hqPercent: maxHqPercent
    };

    logger.log('%2s %-20s %5.0f %5.0f %8.1f %6.1f %6.1f', '##', 'Max Value: ', maxDurability, maxCp, maxQuality, maxProgress, maxHqPercent);

    logger.log('\n%2s %-20s %5.1f %%', '##', 'Success Rate: ', successRate);

    logger.log('');

    logger.log("Monte Carlo Random Example");
    logger.log("==========================");
    MonteCarloSequence(individual, startState, assumeSuccess, false, true, logOutput);

    logger.log('');

    logger.log("Monte Carlo Best Example");
    logger.log("==========================");
    logger.log('%-2s %30s %-5s %-5s %-8s %-8s %-5s %-5s %-5s %-5s %-5s %-5s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'QUA', 'PRG', 'IQ', 'CTL', 'QINC', 'BPRG', 'BQUA', 'WAC', 'S/F', 'Wait');

    for (var i = 0; i < bestSequenceStates.length; i++) {
        var s = bestSequenceStates[i];
        var action = AllActions[s.action];
        var actionName = action ? action.name : '';
        var time = s.step *3 - s.buffUses;
        logger.log('%2d %30s %5.0f %5.0f %8.0f %8.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5d', s.step, actionName, s.durabilityState, s.cpState, s.qualityState, s.progressState, s.iqCnt, s.control, s.qualityGain, s.bProgressGain, s.bQualityGain, s.wastedActions, s.success, time);
    }

    logger.log('');

    logger.log("Monte Carlo Worst Example");
    logger.log("==========================");
    logger.log('%-2s %30s %-5s %-5s %-8s %-8s %-5s %-5s %-5s %-5s %-5s %-5s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'QUA', 'PRG', 'IQ', 'CTL', 'QINC', 'BPRG', 'BQUA', 'WAC', 'S/F', 'Wait');

    for (var i = 0; i < worseSequenceStates.length; i++) {
        var s = worseSequenceStates[i];
        var action = AllActions[s.action];
        var actionName = action ? action.name : '';
        var time = s.step *3 - s.buffUses;
        logger.log('%2d %30s %5.0f %5.0f %8.0f %8.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5.0f %5d', s.step, actionName, s.durabilityState, s.cpState, s.qualityState, s.progressState, s.iqCnt, s.control, s.qualityGain, s.bProgressGain, s.bQualityGain, s.wastedActions, s.success, time);
    }

    logger.log('');

    return {
        successPercent: successRate,
        average: avgStats,
        median: mdnStats,
        min: minStats,
        max: maxStats,
    }
}

function getAverageProperty(stateArray, propName, nRuns) {
    var sumProperty = 0;
    var nSuccesses = 0;
    for (var i=0; i < stateArray.length; i++) {
        var chk = stateArray[i].checkViolations();
        var progressOk = chk.progressOk;
        var durabilityOk = chk.durabilityOk;
        var cpOk = chk.cpOk;

        if (progressOk && durabilityOk && cpOk) {
            nSuccesses += 1;
            sumProperty += stateArray[i][propName];
        }
    }

    return sumProperty / nSuccesses;
}

function getMedianProperty(stateArray, propName, nRuns) {
    var listProperty = [];
    for (var i=0; i < stateArray.length; i++) {
        var chk = stateArray[i].checkViolations();
        var progressOk = chk.progressOk;
        var durabilityOk = chk.durabilityOk;
        var cpOk = chk.cpOk;

        if (progressOk && durabilityOk && cpOk) {
            listProperty.push(stateArray[i][propName]);
        }
    }

    listProperty.sort(function(a, b){return a-b});
    var medianPropIdx = Math.ceil(listProperty.length/2);

    return listProperty[medianPropIdx];
}

function getAverageHqPercent(stateArray) {
    // Because quality can exceed maxQuality, the average will be skewed high and we cannot use average quality as the input to the hqPercentFromQuality function
    var nHQ = 0;
    var nSuccesses = 0;
    for (var i=0; i < stateArray.length; i++) {
        var chk = stateArray[i].checkViolations();
        var progressOk = chk.progressOk;
        var durabilityOk = chk.durabilityOk;
        var cpOk = chk.cpOk;

        if (progressOk && durabilityOk && cpOk) {
            nSuccesses += 1;

            var qualityPercent = stateArray[i]['qualityState'] / stateArray[i].synth.recipe.maxQuality * 100;
            var hqProbability = hqPercentFromQuality(qualityPercent) / 100;
            var hqRand = Math.random();
            if (hqRand <= hqProbability) {
                nHQ += 1;
            }
        }
    }

    return nHQ / nSuccesses * 100;
}

function getMedianHqPercent(stateArray) {
    // Because quality can exceed maxQuality, the median will be skewed high and we cannot use median quality as the input to the hqPercentFromQuality function
    var hqPercents = [];
    for (var i=0; i < stateArray.length; i++) {
        var chk = stateArray[i].checkViolations();
        var progressOk = chk.progressOk;
        var durabilityOk = chk.durabilityOk;
        var cpOk = chk.cpOk;

        if (progressOk && durabilityOk && cpOk) {
            var qualityPercent = Math.min(stateArray[i].synth.recipe.maxQuality, stateArray[i]['qualityState']) / stateArray[i].synth.recipe.maxQuality * 100;
            var hqProbability = hqPercentFromQuality(qualityPercent);
            hqPercents.push(hqProbability);
        }
    }

    hqPercents.sort(function(a, b){return a-b});
    var medianPropIdx = Math.ceil(hqPercents.length/2);

    return hqPercents[medianPropIdx];
}

function getSuccessRate(stateArray) {
    var nSuccesses = 0;
    for (var i=0; i < stateArray.length; i++) {
        var chk = stateArray[i].checkViolations();
        var progressOk = chk.progressOk;
        var durabilityOk = chk.durabilityOk;
        var cpOk = chk.cpOk;

        if (progressOk && durabilityOk && cpOk) {
            nSuccesses += 1;
        }
    }

    return nSuccesses / stateArray.length * 100;
}

function getMinProperty(stateArray, propName) {
    var minProperty = null;
    for (var i=0; i < stateArray.length; i++) {
        if (minProperty === null) {
            minProperty = stateArray[i][propName];
        }
        else {
            if (minProperty > stateArray[i][propName]) {
                minProperty = stateArray[i][propName];
            }
        }
    }
    return minProperty;
}

function getMaxProperty(stateArray, propName) {
    var maxProperty = null;
    for (var i=0; i < stateArray.length; i++) {
        if (maxProperty === null) {
            maxProperty = stateArray[i][propName];
        }
        else {
            if (maxProperty < stateArray[i][propName]) {
                maxProperty = stateArray[i][propName];
            }
        }
    }
    return maxProperty;
}

function hqPercentFromQuality(qualityPercent) {
    return [
        1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8,
        9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 15, 16, 16, 17,
        17, 17, 18, 18, 18, 19, 19, 20, 20, 21, 22, 23, 24, 26, 28, 31, 34, 38, 42, 47, 52, 58, 64, 68,
        71, 74, 76, 78, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 94, 96, 98, 100,
    ][Math.min(100, Math.floor(qualityPercent))]
}

function evalSeq(individual, mySynth, penaltyWeight, qualityPercentTarget) {
    penaltyWeight = penaltyWeight!== undefined ? penaltyWeight : 10000;
    qualityPercentTarget = qualityPercentTarget !== undefined ? qualityPercentTarget : 120;

    var startState = NewStateFromSynth(mySynth);

    var result = simSynth(individual, startState, false, false, false);
    var penalties = 0;

    // Check for feasibility violations
    var chk = result.checkViolations();

    if (!chk.durabilityOk) {
       penalties += Math.abs(result.durabilityState);
    }

    if (!chk.cpOk) {
        penalties += Math.abs(result.cpState);
    }

    if (result.reliability < mySynth.reliabilityIndex) {
        penalties += Math.abs(mySynth.reliabilityIndex - result.reliability);
    }

    if (mySynth.maxLength > 0) {
        var maxActionsExceeded = individual.length - mySynth.maxLength;
        if (maxActionsExceeded > 0) {
            penalties += 0.1 * maxActionsExceeded;
        }
    }

    var totalTime = individual.length * 3 - result.buffUses

    var fitnessProg = Math.min(mySynth.recipe.difficulty, result.progressState);
    var fitnessQual = Math.min(mySynth.recipe.maxQuality * (qualityPercentTarget / 100), result.qualityState);
    var fitnessWasted = -result.wastedActions
    var fitnessLength = -(Math.floor(individual.length / 15))
    var fitnessCpRem = result.cpState
    var fitnessPenalties = -penalties
    var fitnessTime = -totalTime
    var fitnessCpBreak = result.cpState < 0 ? result.cpState : 0;

    return [fitnessCpBreak, fitnessProg, fitnessQual, fitnessLength, fitnessTime, fitnessWasted, fitnessPenalties, fitnessCpRem];
}

evalSeq.weights = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

function heuristicSequenceBuilder(synth) {
    var sequence = [];
    var subSeq1 = [];
    var subSeq2 = [];
    var subSeq3 = [];
    var aa = AllActions;

    var cp = synth.crafter.craftPoints;
    var dur = synth.recipe.durability;
    var progress = 0;

    // Build a list of actions by short name so that we can easily perform lookups
    var actionsByName = {};
    for (var i = 0; i < synth.crafter.actions.length; i++) {
        var action = synth.crafter.actions[i];
        if (action) {
            actionsByName[action.shortName] = true;
        }
    }

    var hasAction = function(actionName) {
        return (actionName in actionsByName);
    };

    var tryAction = function(actionName) {
        return (hasAction(actionName) && cp >= aa[actionName].cpCost && dur - aa[actionName].durabilityCost >= 0);
    };

    var useAction = function(actionName) {
        cp -= aa[actionName].cpCost;
        dur -= aa[actionName].durabilityCost;
    };

    var pushAction = function(seq, actionName) {
        seq.push(aa[actionName]);
        useAction(actionName);
    };

    var unshiftAction = function(seq, actionName) {
        seq.unshift(aa[actionName]);
        useAction(actionName);
    };

    /* Progress to completion
        -- Determine base progress
        -- Determine best action to use from available list
        -- Steady hand if CS is not available
        -- Master's mend if more steps are needed
    */

    var effCrafterLevel = synth.crafter.level;
    if (LevelTable[synth.crafter.level]) {
        effCrafterLevel = LevelTable[synth.crafter.level];
    }
    var effRecipeLevel = synth.recipe.level;

    // If Careful Synthesis 1 is available, use it
    var preferredAction = 'basicSynth';
    // TODO: standardSynth AKA Basic Synthesis Level 31
    if (hasAction('carefulSynthesis')) {
        preferredAction = 'carefulSynthesis';
    }

    // Determine base progress
    var levelDifference = effCrafterLevel - effRecipeLevel;
    var bProgressGain = synth.calculateBaseProgressIncrease(levelDifference, synth.crafter.craftsmanship);
    var progressGain =  bProgressGain;
    progressGain *= aa[preferredAction].progressIncreaseMultiplier;
    progressGain = Math.floor(progressGain);

    var nProgSteps = Math.ceil(synth.recipe.difficulty / progressGain);
    var steps = 0;
    // Final step first
    if (tryAction(preferredAction)) {
        pushAction(subSeq3, preferredAction);
        progress += progressGain;
        steps += 1;
    }

    subSeq2 = [];
    while (progress < synth.recipe.difficulty && steps < nProgSteps) {
        // Don't want to increase progress at 5 durability unless we are able to complete the synth
        if (tryAction(preferredAction) && (dur >= 10)) {
            unshiftAction(subSeq2, preferredAction);
            progress += progressGain;
            steps += 1;
        }
        else if (tryAction('manipulation')) {
            unshiftAction(subSeq2, 'manipulation');
            dur += 30;
        }
        else if (tryAction('mastersMend')) {
            unshiftAction(subSeq2, 'mastersMend');
            dur += 30;
        }
        else {
            break;
        }
    }

    sequence = subSeq2.concat(subSeq3);
    sequence = subSeq1.concat(sequence);

    if (dur <= 20) {
        if (tryAction('manipulation')) {
            unshiftAction(sequence, 'manipulation');
            dur += 30;
        }
        else if (tryAction('mastersMend')) {
            unshiftAction(sequence, 'mastersMend');
            dur += 30;
        }
    }

    subSeq1 = [];
    subSeq2 = [];
    subSeq3 = [];

    /* Improve Quality
     -- Reflect and Inner Quiet at start
     -- Byregot's at end or other Inner Quiet consumer
    */

    if (tryAction('reflect')) {
        pushAction(subSeq1, 'reflect')
    }

    preferredAction = 'basicTouch';

    // ... and put in at least one quality improving action
    if (tryAction(preferredAction)) {
        pushAction(subSeq2, preferredAction);
    }

    subSeq1 = subSeq1.concat(subSeq2);

    // Now add in Byregot's Blessing at the end of the quality improving stage if we can
    if (tryAction('byregotsBlessing')) {
        unshiftAction(sequence, 'byregotsBlessing');
    }

    // ... and what the hell, throw in a great strides just before it
    if (tryAction('greatStrides')) {
        unshiftAction(sequence, 'greatStrides');
    }

    subSeq2 = [];

    // Use up any remaining durability and cp with quality / durability improving actions
    while (cp > 0 && dur > 0) {
        if (tryAction(preferredAction) && dur > 10) {
            pushAction(subSeq2, preferredAction);
        }
        else if (dur < 20) {
            if (tryAction('manipulation')) {
                unshiftAction(subSeq2, 'manipulation');
                dur += 30;
            }
            else if (tryAction('mastersMend')) {
                pushAction(subSeq2, 'mastersMend');
                dur += 30;
            }
            else {
                break;
            }
        }
        else {
            break;
        }
    }

    sequence = subSeq2.concat(sequence);
    sequence = subSeq1.concat(sequence);

    // Pray
    return sequence;
}


// Helper Functions
//=================

function _typeof(x) {
    if (Array.isArray(x)) {
        return 'array';
    }
    else {
        return typeof x;
    }
}

function clone(x) {
    var seen = {};
    function _clone(x) {
        if (x === null) {
            return null;
        }
        for (var s in seen) {
            if (s === x) {
                return seen[s];
            }
        }
        switch(_typeof(x)) {
            case 'object':
                var newObject = Object.create(Object.getPrototypeOf(x));
                seen[x] = newObject;
                for (var p in x) {
                    newObject[p] = _clone(x[p]);
                }
                return newObject;
            case 'array':
                var newArray = [];
                seen[x] = newArray;
                for (var pp in x) {
                    newArray[pp] = _clone(x[pp]);
                }
                return newArray;
            case 'number':
                return x;
            case 'string':
                return x;
            case 'boolean':
                return x;
            default:
                return x;
        }
    }
    return _clone(x);
}

var LevelTable = {
    51: 120, // 120
    52: 125, // 125
    53: 130, // 130
    54: 133, // 133
    55: 136, // 136
    56: 139, // 139
    57: 142, // 142
    58: 145, // 145
    59: 148, // 148
    60: 150, // 150
    61: 260,
    62: 265,
    63: 270,
    64: 273,
    65: 276,
    66: 279,
    67: 282,
    68: 285,
    69: 288,
    70: 290,
    71: 390,
    72: 395,
    73: 400,
    74: 403,
    75: 406,
    76: 409,
    77: 412,
    78: 415,
    79: 418,
    80: 420,
    81: 517,
    82: 520,
    83: 525,
    84: 530,
    85: 535,
    86: 540,
    87: 545,
    88: 550,
    89: 555,
    90: 560
};
