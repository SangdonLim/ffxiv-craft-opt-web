(function (){
  'use strict';

  var allClasses = [
    "Alchemist",
    "Armorer",
    "Blacksmith",
    "Carpenter",
    "Culinarian",
    "Goldsmith",
    "Leatherworker",
    "Weaver"
  ];

  var actionIconDispatchInfo = {
    basicSynthesis: {                                                   },
    basicTouch: {                                                       },
    mastersMend: {        useCrafterClassAgnosticIcon: true,            },
    rapidSynthesis: {     useCrafterClassAgnosticIcon: true,            },
    hastyTouch: {         useCrafterClassAgnosticIcon: true,            },
    observe: {            useCrafterClassAgnosticIcon: true,            },
    tricksOfTheTrade: {   useCrafterClassAgnosticIcon: true,            },
    wasteNot: {           useCrafterClassAgnosticIcon: true, buff: true },
    veneration: {         useCrafterClassAgnosticIcon: true, buff: true },
    standardTouch: {                                                    },
    greatStrides: {       useCrafterClassAgnosticIcon: true, buff: true },
    innovation: {         useCrafterClassAgnosticIcon: true, buff: true },
    finalAppraisal: {     useCrafterClassAgnosticIcon: true, buff: true },
    wasteNot2: {          useCrafterClassAgnosticIcon: true, buff: true },
    byregotsBlessing: {   useCrafterClassAgnosticIcon: true,            },
    preciseTouch: {                                                     },
    muscleMemory: {       useCrafterClassAgnosticIcon: true,            },
    carefulSynthesis: {   useCrafterClassAgnosticIcon: true,            },
    manipulation: {       useCrafterClassAgnosticIcon: true, buff: true },
    prudentTouch: {                                                     },
    focusedSynthesis: {                                                 },
    focusedTouch: {                                                     },
    reflect: {            useCrafterClassAgnosticIcon: true,            },
    preparatoryTouch: {                                                 },
    groundwork: {                                                       },
    delicateSynthesis: {                                                },
    intensiveSynthesis: {                                               },
    trainedEye: {         useCrafterClassAgnosticIcon: true,            },
    advancedTouch: {                                                    },
    heartAndSoul: {       useCrafterClassAgnosticIcon: true, buff: true },
    prudentSynthesis: {                                                 },
    trainedFinesse: {     useCrafterClassAgnosticIcon: true,            }
  };

  var obsoleteActions = {
    innerQuiet: true,
  };

  var actionsByName = {};
  var allActions = [];

  for (var shortName in actionIconDispatchInfo) {
    if (actionIconDispatchInfo.hasOwnProperty(shortName)) {
      var iconInfo = actionIconDispatchInfo[shortName];
      var action = AllActions[shortName];

      action.buff = iconInfo.buff;
      action.skillID = iconInfo.skillID;
      var imagePaths = {};
      for (var j = 0; j < allClasses.length; j++) {
        var thisCrafterClass = allClasses[j];
        if (iconInfo.useCrafterClassAgnosticIcon) {
          imagePaths[thisCrafterClass] = 'img/actions/' + shortName + '.png';
        } else {
          imagePaths[thisCrafterClass] = 'img/actions/' + thisCrafterClass + '/' + shortName + '.png';
        }
        action.imagePaths = imagePaths;
      }

      actionsByName[shortName] = action;
      allActions.push(action);
    }
  }

  var actionGroups = [
    {
      name: "First Turn Only", actions: [
        "muscleMemory",
        "reflect",
        "trainedEye"
      ]
    },
    {
      name: "Synthesis", actions: [
        "basicSynthesis",
        "rapidSynthesis",
        "carefulSynthesis",
        "focusedSynthesis",
        "groundwork",
        "delicateSynthesis",
        "prudentSynthesis"
      ]
    },
    {
      name: "Quality", actions: [
        "basicTouch",
        "hastyTouch",
        "standardTouch",
        "byregotsBlessing",
        "prudentTouch",
        "focusedTouch",
        "preparatoryTouch",
        "delicateSynthesis",
        "advancedTouch",
        "trainedFinesse"
      ]
    },
    {
      name: "Durability", actions: [
        "mastersMend",
        "wasteNot",
        "wasteNot2",
        "manipulation"
      ]
    },
    {
      name: "Buffs", actions: [
        "veneration",
        "greatStrides",
        "innovation",
    ]
    },
    {
      name: "Specialist (requires consumables)", actions: [
        "tricksOfTheTrade",
        "preciseTouch",
        "intensiveSynthesis",
        "heartAndSoul",
    ]
    },
    {
      name: "Other", actions: [
        "observe",
        "finalAppraisal"
    ]
    }
  ];

  function getActionImagePath(action, cls) {
    if (!angular.isDefined(action)) {
      console.error('undefined action param');
      return 'img/actions/unknown.svg';
    }
    var info = actionsByName[action];
    if (!angular.isDefined(info)) {
      if (obsoleteActions[action])
        return 'img/actions/' + action +'.png';
      else
        console.error('unknown action: %s', action);
      return 'img/actions/unknown.svg';
    }
    return info.imagePaths[cls];
  }

  angular.module('ffxivCraftOptWeb.services.actions', []).
    value('_allClasses', allClasses).
    value('_allActions', allActions).
    value('_actionsByName', actionsByName).
    value('_actionGroups', actionGroups).
    value('_getActionImagePath', getActionImagePath)

})();
