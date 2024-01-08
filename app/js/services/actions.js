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
    basicSynth: {                                                       },
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
    basicSynth2: {                                                      },
    wasteNot2: {          useCrafterClassAgnosticIcon: true, buff: true },
    byregotsBlessing: {   useCrafterClassAgnosticIcon: true,            },
    preciseTouch: {                                                     },
    muscleMemory: {       useCrafterClassAgnosticIcon: true,            },
    carefulSynthesis: {   useCrafterClassAgnosticIcon: true,            },
    rapidSynthesis2: {    useCrafterClassAgnosticIcon: true,            },
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
        "basicSynth",
        "rapidSynthesis",
        "basicSynth2",
        "carefulSynthesis",
        "rapidSynthesis2",
        "focusedSynthesis",
        "groundwork",
        "intensiveSynthesis",
        "prudentSynthesis"
      ]
    },
    {
      name: "Synthesis + Quality", actions: [
        "delicateSynthesis"
      ]
    },
    {
      name: "Quality", actions: [
        "basicTouch",
        "hastyTouch",
        "standardTouch",
        "byregotsBlessing",
        "preciseTouch",
        "prudentTouch",
        "focusedTouch",
        "preparatoryTouch",
        "advancedTouch",
        "trainedFinesse"
      ]
    },
    {
      name: "CP", actions: [
        "tricksOfTheTrade"
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
      name: "Other", actions: [
        "observe"
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

  function iActionClassSpecific(name) {
    if (!angular.isDefined(name)) {
      console.error('undefined action');
      return false;
    }
    var info = actionsByName[name];
    if (!angular.isDefined(info)) {
      if (!obsoleteActions[name])
        console.error('unknown action: %s', name);
      return false;
    }
    return info.cls !== 'All';
  }

  angular.module('ffxivCraftOptWeb.services.actions', []).
    value('_allClasses', allClasses).
    value('_allActions', allActions).
    value('_actionsByName', actionsByName).
    value('_actionGroups', actionGroups).
    value('_getActionImagePath', getActionImagePath).
    value('_iActionClassSpecific', iActionClassSpecific)

})();
