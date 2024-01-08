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
    basicSynth: {                                  },
    basicTouch: {                                  },
    mastersMend: {        common: true,            },
    rapidSynthesis: {     common: true,            },
    hastyTouch: {         common: true,            },
    observe: {            common: true,            },
    tricksOfTheTrade: {   common: true,            },
    wasteNot: {           common: true, buff: true },
    veneration: {         common: true, buff: true },
    standardTouch: {                               },
    greatStrides: {       common: true, buff: true },
    innovation: {         common: true, buff: true },
    basicSynth2: {                                 },
    wasteNot2: {          common: true, buff: true },
    byregotsBlessing: {   common: true,            },
    preciseTouch: {                                },
    muscleMemory: {       common: true,            },
    carefulSynthesis: {   common: true,            },
    rapidSynthesis2: {    common: true,            },
    manipulation: {       common: true, buff: true },
    prudentTouch: {                                },
    focusedSynthesis: {                            },
    focusedTouch: {                                },
    reflect: {            common: true,            },
    preparatoryTouch: {                            },
    groundwork: {                                  },
    delicateSynthesis: {                           },
    intensiveSynthesis: {                          },
    trainedEye: {         common: true,            },
    advancedTouch: {                               },
    prudentSynthesis: {                            },
    trainedFinesse: {     common: true,            }
  };

  var obsoleteActions = {
    byregotsBrow: true,
    brandOfEarth: true,
    brandOfFire: true,
    brandOfIce: true,
    brandOfLightning: true,
    brandOfWater: true,
    brandOfWind: true,
    nameOfEarth: true,
    nameOfFire: true,
    nameOfIce: true,
    nameOfLightning: true,
    nameOfWater: true,
    nameOfWind: true,
    flawlessSynthesis: true,
    innerQuiet: true,
    brandOfTheElements: true,
    nameOfTheElements: true,
    patientTouch: true,
  };

  var actionsByName = {};
  var allActions = [];

  for (var shortName in actionIconDispatchInfo) {
    if (actionIconDispatchInfo.hasOwnProperty(shortName)) {
      var extraInfo = actionIconDispatchInfo[shortName];
      var action = AllActions[shortName];

      action.buff = extraInfo.buff;
      action.skillID = extraInfo.skillID;
      var imagePaths = {};
      for (var j = 0; j < allClasses.length; j++) {
        var cls = allClasses[j];
        if (action.cls == 'All') {
          if (extraInfo.common) {
            imagePaths[cls] = 'img/actions/' + shortName + '.png';
          }
          else {
            imagePaths[cls] = 'img/actions/' + cls + '/' + shortName + '.png';
          }
        }
        else {
          imagePaths[cls] = 'img/actions/' + action.cls + '/' + shortName + '.png';
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
