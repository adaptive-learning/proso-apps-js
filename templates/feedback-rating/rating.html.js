angular.module("templates/feedback-rating/rating.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/feedback-rating/rating.html",
    "<style>\n" +
    "    .rating .btn {\n" +
    "        margin: 20px;\n" +
    "    }\n" +
    "</style>\n" +
    "<div class=\"modal-header text-center\">\n" +
    "    <h3 class=\"modal-title\">{{ \"How difficult are the questions?\" | trans }}</h3>\n" +
    "    {{ \"Your answer helps us adjust difficulty of questions.\" | trans}}\n" +
    "</div>\n" +
    "<div class=\"rating modal-body\">\n" +
    "    <div class=\" text-center\" ng-hide=\"answer\">\n" +
    "        <a class=\"btn btn-lg btn-success\" ng-click=\"vote(1)\">\n" +
    "            {{\"Too easy\" | trans }}\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-lg btn-primary\" ng-click=\"vote(2)\">\n" +
    "            {{ \"Appropriate\" | trans }}\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-lg btn-danger\" ng-click=\"vote(3)\">\n" +
    "            {{ \"Too difficult\" | trans }}\n" +
    "        </a>\n" +
    "        <div class=\"clearfix\"></div>\n" +
    "        <a class=\"pull-right dont-know\" href=\"\" ng-click=\"cancel()\">\n" +
    "            {{ \"Don't know / Don't want to rate\" | trans }}\n" +
    "        </a>\n" +
    "        <div class=\"clearfix\"></div>\n" +
    "    </div>\n" +
    "    <alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert($index)\">{{alert.msg}}</alert>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\" ng-show=\"answer\">\n" +
    "    <button class=\"btn btn-danger\" ng-click=\"cancel()\">\n" +
    "        {{ \"Close\" | trans }}\n" +
    "    </button>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);
