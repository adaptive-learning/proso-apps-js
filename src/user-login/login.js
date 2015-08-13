var m = angular.module('proso.apps.user-login', ['ui.bootstrap', 'gettext', 'proso.apps.user-user', 'angulartics', 'angulartics.google.analytics']);

m.controller('LoginController', ['$scope', '$modalInstance', 'signupModal', 'userService', 'gettextCatalog', '$analytics',
    function ($scope, $modalInstance, signupModal, userService, gettextCatalog, $analytics) {

    $scope.credentials = {};
    $scope.alerts = [];

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.loginGoogle = function() {
        $analytics.eventTrack('click', {
            category: 'login',
            label: '/login/google',
        });
        userService.loginGoogle();
    };

    $scope.loginFacebook = function() {
        $analytics.eventTrack('click', {
            category: 'login',
            label: '/login/facebook',
        });
        userService.loginFacebook();
    };

    $scope.loginEmail = function() {
        $analytics.eventTrack('click', {
            category: 'login',
            label: '/login/email',
        });
        userService
            .login($scope.credentials.username, $scope.credentials.password)
            .error($scope.onError)
            .success(function() {
                $scope.cancel();
            });
    };

    $scope.openSignupModal = function() {
        $scope.cancel();
        signupModal.open();
    };

    $scope.signup = function() {
        $analytics.eventTrack('click', {
            category: 'signup',
            label: '/signup/email',
        });
        userService
            .signupParams(
                $scope.credentials.username,
                $scope.credentials.email,
                $scope.credentials.password,
                $scope.credentials.password_check,
                $scope.credentials.first_name,
                $scope.credentials.last_name
            )
            .error($scope.onError)
            .success(function() {
                $modalInstance.close();
            });
    };

    $scope.onError = function(error) {
        $analytics.eventTrack('error', {
            category: 'login',
            label: 'error/login'
        });
        $scope.alerts.push({
            type: error.type || 'danger',
            msg: error.msg || gettextCatalog.getString('Something wrong has happened.')
        });
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
}]);

m.factory('signupModal', ['$modal', function($modal) {
    return {
        open: function() {
            $modal.open({
                templateUrl: 'templates/user-login/signup-modal.html',
                controller: 'LoginController',
            });
        }
    };
}]);

m.factory('loginModal', ["$modal", function($modal) {
    return {
        open: function() {
            $modal.open({
                templateUrl: 'templates/user-login/login-modal.html',
                controller: 'LoginController',
            });
        }
    };
}]);

m.directive('loginButton', ['loginModal', function(loginModal) {
    return {
        restrict: 'A',
        link: function (scope, element) {
            element.bind('click', function(){
                loginModal.open();
            });
        }
    };
}]);
