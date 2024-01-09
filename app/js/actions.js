function Action(shortName, name, durabilityCost, cpCost, successProbability, qualityIncreaseMultiplier, progressIncreaseMultiplier, aType, activeTurns, level) {
    this.shortName = shortName;
    this.name = name;
    this.durabilityCost = durabilityCost;
    this.cpCost = cpCost;
    this.successProbability = successProbability;
    this.qualityIncreaseMultiplier = qualityIncreaseMultiplier;
    this.progressIncreaseMultiplier = progressIncreaseMultiplier;
    this.type = aType;

    if (aType != 'immediate') {
        this.activeTurns = activeTurns;      // Save some space
    }
    else {
        this.activeTurns = 1;
    }

    this.level = level;

}

// Actions Table
//==============
// parameters:
//   shortName, name, durabilityCost, cpCost,
//   successProbability, qualityIncreaseMultiplier, progressIncreaseMultiplier,
//   aType, activeTurns, level
var AllActions = {
    dummyAction: new Action(        'dummyAction',        '______________',       0,   0, 1.0,  0.0, 0.0, 'immediate', 1,  1),
    basicSynthesis: new Action(     'basicSynthesis',     'Basic Synthesis',     10,   0, 1.0,  0.0, 1.0, 'immediate', 1,  1),
    basicTouch: new Action(         'basicTouch',         'Basic Touch',         10,  18, 1.0,  1.0, 0.0, 'immediate', 1,  5),
    mastersMend: new Action(        'mastersMend',        'Master\'s Mend',       0,  88, 1.0,  0.0, 0.0, 'immediate', 1,  7),
    rapidSynthesis: new Action(     'rapidSynthesis',     'Rapid Synthesis',     10,   0, 0.5,  0.0, 2.5, 'immediate', 1,  9),
    hastyTouch: new Action(         'hastyTouch',         'Hasty Touch',         10,   0, 0.6,  1.0, 0.0, 'immediate', 1,  9),
    observe: new Action(            'observe',            'Observe',              0,   7, 1.0,  0.0, 0.0, 'immediate', 1, 13),
    wasteNot: new Action(           'wasteNot',           'Waste Not',            0,  56, 1.0,  0.0, 0.0, 'countdown', 4, 15),
    veneration: new Action(         'veneration',         'Veneration',           0,  18, 1.0,  0.0, 0.0, 'countdown', 4, 15),
    standardTouch: new Action(      'standardTouch',      'Standard Touch',      10,  32, 1.0, 1.25, 0.0, 'immediate', 1, 18),
    greatStrides: new Action(       'greatStrides',       'Great Strides',        0,  32, 1.0,  0.0, 0.0, 'countdown', 3, 21),
    innovation: new Action(         'innovation',         'Innovation',           0,  18, 1.0,  0.0, 0.0, 'countdown', 4, 26),
    finalAppraisal: new Action(     'finalAppraisal',     'Final Appraisal',      0,   1, 1.0,  0.0, 0.0, 'countdown', 5, 42),
    wasteNot2: new Action(          'wasteNot2',          'Waste Not II',         0,  98, 1.0,  0.0, 0.0, 'countdown', 8, 47),
    byregotsBlessing: new Action(   'byregotsBlessing',   'Byregot\'s Blessing', 10,  24, 1.0,  1.0, 0.0, 'immediate', 1, 50),
    muscleMemory: new Action(       'muscleMemory',       'Muscle Memory',       10,   6, 1.0,  0.0, 3.0, 'countdown', 5, 54),
    carefulSynthesis: new Action(   'carefulSynthesis',   'Careful Synthesis',   10,   7, 1.0,  0.0, 1.5, 'immediate', 1, 62),
    manipulation: new Action(       'manipulation',       'Manipulation',         0,  96, 1.0,  0.0, 0.0, 'countdown', 8, 65),
    prudentTouch: new Action(       'prudentTouch',       'Prudent Touch',        5,  25, 1.0,  1.0, 0.0, 'immediate', 1, 66),
    focusedSynthesis: new Action(   'focusedSynthesis',   'Focused Synthesis',   10,   5, 0.5,  0.0, 2.0, 'immediate', 1, 67),
    focusedTouch: new Action(       'focusedTouch',       'Focused Touch',       10,  18, 0.5,  1.5, 0.0, 'immediate', 1, 68),
    reflect: new Action(            'reflect',            'Reflect',             10,  24, 1.0,  1.0, 0.0, 'immediate', 1, 69),
    preparatoryTouch: new Action(   'preparatoryTouch',   'Preparatory Touch',   20,  40, 1.0,  2.0, 0.0, 'immediate', 1, 71),
    groundwork: new Action(         'groundwork',         'Groundwork',          20,  18, 1.0,  0.0, 3.0, 'immediate', 1, 72),
    delicateSynthesis: new Action(  'delicateSynthesis',  'Delicate Synthesis',  10,  32, 1.0,  1.0, 1.0, 'immediate', 1, 76),
    trainedEye: new Action(         'trainedEye',         'Trained Eye',         10, 250, 1.0,  0.0, 0.0, 'immediate', 1, 80),
    advancedTouch: new Action(      'advancedTouch',      'Advanced Touch',      10,  46, 1.0,  1.5, 0.0, 'immediate', 1, 84),
    prudentSynthesis: new Action(   'prudentSynthesis',   'Prudent Synthesis',    5,  18, 1.0,  0.0, 1.8, 'immediate', 1, 88),
    trainedFinesse: new Action(     'trainedFinesse',     'Trained Finesse',      0,  32, 1.0,  1.0, 0.0, 'immediate', 1, 90)
};
