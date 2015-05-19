var m = angular.module('proso.apps.demo');

m.controller('RatingModalControllerDemo', ['$rootScope', '$scope', function($scope, $rootScope) {
    $scope.openRating = function() {
        $rootScope.$emit('openRatingModal', []);
    };
}]);
