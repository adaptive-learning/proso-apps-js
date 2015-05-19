angular.module("templates/feedback-comment/comment.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/feedback-comment/comment.html",
    "<div class=\"modal-header\">\n" +
    "    <h3 class=\"modal-title\">{{ \"Write to us\" | trans }}</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    <label>\n" +
    "      {{ \"Did you find a bug in the app? Do you have an improvement idea? Or any other comment? We are eager to hear anything you'd like to tell us.\" | trans }}\n" +
    "    </label>\n" +
    "    <textarea ng-model=\"feedback.text\" class=\"form-control\" rows=\"8\" ></textarea>\n" +
    "    <label>\n" +
    "      {{ \"Your email address (optional)\" | trans }}\n" +
    "    </label>\n" +
    "    <input type=\"text\" ng-model=\"feedback.email\" class=\"form-control\"/>\n" +
    "    <br>\n" +
    "    <alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert($index)\">{{alert.msg}}</alert>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button ng-disabled=\"sending\" class=\"btn btn-primary\" ng-click=\"send()\">\n" +
    "      {{ \"Send\" | trans }}\n" +
    "    </button>\n" +
    "    <button class=\"btn btn-danger\" ng-click=\"cancel()\">\n" +
    "      {{ \"Close\" | trans }}\n" +
    "    </button>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);
