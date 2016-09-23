var m = angular.module('proso.apps.feedback-adjustment', ['ui.bootstrap', 'gettext']);

m.controller('AdjustmentModalController', ['$scope', '$rootScope', '$modal', '$routeParams',
        function ($scope, $rootScope, $modal, $routeParams) {

    $scope.openAdjustmentModal = function() {
        if ($scope.email) {
            $scope.feedback.email = $scope.email;
        }

        $modal.open({
            templateUrl: 'templates/feedback-adjustment/adjustment.html',
            controller: 'AdjustmentModalInstanceController',
            size: 'lg',
            resolve: {
                feedback: function () {
                    return $scope.feedback;
                }
            }
        });
    };

    $rootScope.$on('questionSetFinished', function(event, args) {
        $scope.openAdjustmentModal();
    });

    $scope.$on('$routeChangeSuccess', function() {
        if ($routeParams.adjustmentrating) {
          $scope.openAdjustmentModal();
        }
    });
}]);

m.controller('AdjustmentModalInstanceController', [
        '$scope', '$modalInstance', '$http', '$cookies', 'gettextCatalog', 'customConfig',
        function($scope, $modalInstance, $http, $cookies, gettextCatalog, customConfig) {

    $scope.alerts = [];

    $scope.vote = function(answer) {
        $scope.answer = answer;
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;

        $http.post('/feedback/rating/', {'value': answer / 5 + 6}).success(function(data){
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
        customConfig.updateConfig(answer);
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

m.factory('customConfig', ['$http', 'configService', function($http, configService) {
  var that = {
    updateConfig: function(answer) {
        var key = 'item_selector.parameters.target_probability';
        var app_name = 'proso_models';
        var currentValue = configService.getConfig(app_name, key, 0);

        var data = {
          app_name: app_name,
          key : key,
          value: currentValue + answer,
          condition_key: '',
          condition_value: '',
        };
        var promise = $http.post('/common/custom_config/', data);
        return promise;
    },
  };
  return that;
}]);
