var m = angular.module('proso.apps.feedback-comment', ['ui.bootstrap', 'gettext']);

m.directive('feedbackComment', ['$modal', '$window', 'gettextCatalog', function ($modal, $window, gettextCatalog) {
    return {
        restrict: 'A',
        link: function ($scope, element, attrs) {
            $scope.feedback = {
                email: '@',
                text: '',
            };

            $scope.openFeedback = function () {
                if (attrs.email) {
                    $scope.feedback.email = attrs.email;
                }

                $modal.open({
                    templateUrl: 'templates/feedback-comment/comment.html',
                    controller: ModalFeedbackCtrl,
                    size: 'lg',
                    resolve: {
                        feedback: function () {
                            return $scope.feedback;
                        }
                    }
                });
            };

            var ModalFeedbackCtrl = ['$scope', '$modalInstance', '$http', '$cookies', '$location', 'feedback', 'gettextCatalog',
                function ($scope, $modalInstance, $http, $cookies, $location, feedback, gettextCatalog) {

                $scope.feedback = feedback;
                $scope.alerts = [];

                $scope.send = function() {
                    feedback.page = $location.absUrl();
                    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
                    $http.post('/feedback/feedback/', feedback).success(function(data){
                        $scope.alerts.push({
                            type : 'success',
                            msg : gettextCatalog.getString('Thank you for the message. User feedback is very important for us.'),
                        });
                        $scope.sending = false;
                        feedback.text = '';
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
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            }];

            element.bind('click', $scope.openFeedback);
        }
    };
}]);
