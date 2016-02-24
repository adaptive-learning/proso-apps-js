/* global describe */
/* global beforeEach */
/* global afterEach */
/* global it */
/* global expect */

describe("User Service", function() {
    var $httpBackend, $userService;
    var test_user = {
    };
    var test_user_question = {
    };
    var test_signup_data = {
    };
    var error = { "error_type": "error_type", "error": "error"};

    beforeEach(module('proso.apps.user-questions'));

    beforeEach(inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $userService = $injector.get('userQuestionsService');
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it("provide basic structure", function() {
        expect($userService.getQuestions).toBeDefined();
        expect($userService.getQuestionsToAsk).toBeDefined();
        expect($userService.saveAnswer).toBeDefined();
    });


});

