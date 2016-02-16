var m = angular.module('proso.apps.user-questions', []);
m.factory('userQuestionsService', ["$http", function($http) {
  return {
    getQuestions: function() {
      return $http.get('/user/questions/?all=true');
    },
    getQuestionsToAsk: function() {
      return $http.get('/user/questions_to_ask/');
    },
    saveAnswer: function(question, answer) {
      var answer_dict = {
        question : question.id,
      };
      if (answer && answer.id) {
        answer_dict.closed_answer = answer.id;
      } else if (answer) {
        answer_dict.open_answer = answer;
      }
      var data = {
        answers : [answer_dict],
      };
      return $http.post('/user/answer_question/', data);
    }
  };
}]);

m.directive('userQuestionsBanner', ['userQuestionsService', '$rootScope', 'userService',
    function(userQuestionsService, $rootScope, userService) {
  return {
    restrict: 'A',
    templateUrl : 'templates/user-questions/user_questions_banner.html',
    link: function ($scope) {
      var eventName = 'questionSetFinished';
      $rootScope.$on(eventName, function() {
        var answered_count = userService.user.profile.number_of_answers;
        userQuestionsService.getQuestionsToAsk().success(function(data) {
          $scope.questions = data.data.filter(function(q) {
            return q.on_events && q.on_events[0] &&
              q.on_events[0].type === eventName &&
              q.on_events[0].value <= answered_count &&
              answered_count < q.on_events[0].value + 10;
          });
          $scope.questions = $scope.questions.slice(0, 1);
        });
      });

      $scope.saveUserQuesiton = function(question, answer) {
        if (answer) {
          question.answer = answer;
        }
        question.processing = true;
        userQuestionsService.saveAnswer(
            question, question.answer).success(function(data) {
          question.processing = false;
          question.saved = true;
        }).error(function(data) {
          question.processing = false;
          question.error = true;
        });
      };
    }
  };
}]);

