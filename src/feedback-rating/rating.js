var m = angular.module('proso.apps.feedback-rating', ['ui.bootstrap', 'gettext']);

m.controller('RatingModalController', ['$scope', '$rootScope', '$modal', function ($scope, $rootScope, $modal) {

    $scope.open = function() {
        if ($scope.email) {
            $scope.feedback.email = $scope.email;
        }

        $modal.open({
            templateUrl: 'templates/feedback-rating/rating.html',
            controller: 'RatingModalInstanceController',
            size: 'lg',
            resolve: {
                feedback: function () {
                    return $scope.feedback;
                }
            }
        });
    };

    $rootScope.$on('openRatingModal', function(event, args) {
        $scope.open();
    });
}]);

m.controller('RatingModalInstanceController', ['$scope', '$modalInstance', '$http', '$cookies', 'gettextCatalog', function($scope, $modalInstance, $http, $cookies, gettextCatalog) {

    $scope.alerts = [];

    $scope.vote = function(answer) {
        $scope.answer = answer;
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        $http.post('/feedback/rating/', {'value': answer}).success(function(data){
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
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
        $modalInstance.dismiss('cancel');
    };
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
}]);

m.directive('ratingModal', ['$window', function ($window) {
    return {
        restrict: 'E',
        controller: 'RatingModalController',
    };
}]);

