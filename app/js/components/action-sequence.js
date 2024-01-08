(function () {
  'use strict';

  angular
    .module('ffxivCraftOptWeb.components')
    .directive('actionSequence', factory);

  function factory() {
    return {
      restrict: 'E',
      templateUrl: 'components/action-sequence.html',
      scope: {
        class: '@',
        actions: '=',
        cls: '=',
        onClick: '=',
        actionClasses: '=',
        draggable: '=',
        tooltipPlacement: '@'
      },
      controller: controller
    }
  }

  function controller($scope, _actionsByName, _tooltips, _getActionImagePath) {
    $scope.getActionImagePath = _getActionImagePath;
    $scope.cssClassesForAction = cssClassesForAction;
    $scope.actionForName = actionForName;

    $scope.actionTooltips = {};

    $scope.$on("tooltipCacheUpdated", updateActionTooltips);
    $scope.$watch("cls", updateActionTooltips);

    updateActionTooltips();

    //////////////////////////////////////////////////////////////////////////

    function updateActionTooltips() {
      var newTooltips = {};
      angular.forEach(_actionsByName, function (actionInfo) {
        var key;
        key = $scope.cls + actionInfo.shortName;
        newTooltips[actionInfo.shortName] = _tooltips.actionTooltips[key];
      });
      $scope.actionTooltips = newTooltips;
    }

    function cssClassesForAction(action, index) {
      var classes = {};
      if ($scope.actionClasses) {
        classes = $scope.actionClasses(action, $scope.cls, index);
      }
      return classes;
    }

    function actionForName(name) {
      return _actionsByName[name];
    }
  }
})();
