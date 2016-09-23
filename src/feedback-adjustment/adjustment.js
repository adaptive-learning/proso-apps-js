var m = angular.module('proso.apps.feedback-adjustment', ['ui.bootstrap', 'gettext']);

m.controller('AdjustmentModalController', ['$scope', '$rootScope', '$modal', '$routeParams',
        function ($scope, $rootScope, $modal, $routeParams) {

    $scope.openAdjustmentModal = function(config) {
        if ($scope.email) {
            $scope.feedback.email = $scope.email;
        }

        $modal.open({
            templateUrl: 'templates/feedback-adjustment/adjustment.html',
            controller: 'AdjustmentModalInstanceController',
            size: 'lg',
            resolve: {
                practiceFilter: function () {
                    return config.filter;
                },
                feedback: function () {
                    return $scope.feedback;
                },
            }
        });
    };

    $rootScope.$on('questionSetFinished', function(event, args) {
        $scope.openAdjustmentModal(args);
    });

    $scope.$on('$routeChangeSuccess', function() {
        if ($routeParams.adjustmentrating) {
          var filter = {
            filter : [[
              'proso_flashcards_context/' + $routeParams.context,
            ]],
          };
          if ($routeParams.category) {
            filter.filter.push(['proso_flashcards_category/' + $routeParams.category]);
          } 

          $rootScope.$emit('questionSetFinished', filter);
        }
    });
}]);

m.controller('AdjustmentModalInstanceController', [
        '$scope', '$modalInstance', '$http', '$cookies', 'gettextCatalog', 'customConfig', 'practiceFilter',
        function($scope, $modalInstance, $http, $cookies, gettextCatalog, customConfig, practiceFilter) {

    $scope.alerts = [];

    $scope.vote = function(answer) {
        $scope.answer = answer;
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;

        $http.post('/feedback/rating/', {'value': answer / 10 + 6}).success(function(data){
            $scope.alerts.push({
                type : 'success',
                msg : gettextCatalog.getString('Thank you for your rating.'),
            });
            $scope.sending = false;
        }).error(function(){
            $scope.alerts.push({
                type : 'danger',
                msg : gettextCatalog.getString("Something wrong has happened."),
            });
            $scope.sending = false;
        });
        $scope.sending = true;
        customConfig.updateConfig(answer, practiceFilter);
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
        $modalInstance.dismiss('cancel');
    };
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
}]);

m.directive('adjustmentModal', ['$window', function ($window) {
    return {
        restrict: 'E',
        controller: 'AdjustmentModalController',
    };
}]);

m.factory('customConfig', ['$http', function($http) {
  var that = {
    updateConfig: function(answer, practiceFilter) {
        var key = 'item_selector.parameters.target_probability';
        var app_name = 'proso_models';
        var filter = angular.toJson(practiceFilter);
        $http.get('common/config/?filter=' + filter).success(function(config) {
          var currentValue = 0;
          try {
            currentValue = config.data.proso_models.item_selector.parameters.target_probability;
          } catch (e) {
            console.error(e);
          }
          var data = {
            app_name: app_name,
            key : key,
            value: Math.max(0, Math.min(1, currentValue + answer / 100)),
            condition_key: 'practice_filter',
            condition_value: filter,
          };
          var promise = $http.post('/common/custom_config/', data);
        });
    },
  };
  return that;
}]);
