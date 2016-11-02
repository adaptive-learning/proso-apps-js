var config;
var configServiceMock = function(){
    var self = this;
    config = {"proso_models": { "practice": {"test": {
        "set_length": 10,
        "question_queue_size_max": 1,
        "question_queue_size_min": 1,
        "save_answer_immediately": false,
        "cache_context": false
    }}}};

    self.getConfig = function(app_name, key, default_value){
        if (config === null){
            console.error("Config not loaded");
            return;
        }

        var variable = config[app_name];
        var path =  key.split(".");
        for (var i=0; i < path.length; i++){
            variable = variable[path[i]];
            if (typeof variable === 'undefined'){ return default_value; }
        }
        return variable;
    };

    self.getOverridden = function () {
        return {};
    };
};

describe("Practice Service - questions", function() {
    var $httpBackend, $practiceService, $timeout;

    var generate_questions = function(limit){
        var questions = [];
        for (var i = 0; i < limit; i++){
            questions.push(i);
        }
        return questions;
    };

    beforeEach(module('proso.apps.models-practice', "ngCookies"));

    beforeEach(module(function ($provide) { $provide.service("configService", configServiceMock); }));

    beforeEach(inject(function($injector) {

        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get("$timeout");
        $practiceService = $injector.get('practiceService');
    }));

    beforeEach(function(){
        for (var limit = 1; limit <=10; limit++){
            $httpBackend.whenGET(new RegExp("\/models\/practice\/?.*limit="+limit+".*"))
                .respond(200, {data: generate_questions(limit)});
        }
        $practiceService.initSet("test");
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


    it("should provide interface", function(){
        expect($practiceService.getCurrent).toBeDefined();
        expect($practiceService.initSet).toBeDefined();
        expect($practiceService.setFilter).toBeDefined();
        expect($practiceService.saveAnswer).toBeDefined();
        expect($practiceService.saveAnswerToCurrentQuestion).toBeDefined();
        expect($practiceService.flushAnswerQueue).toBeDefined();
        expect($practiceService.getQuestion).toBeDefined();
        expect($practiceService.getSummary).toBeDefined();
    });

    it("getting first question", function(){

        $practiceService.getQuestion().then(function(question){
            expect(question).toBe(0);
        });
        $httpBackend.flush();
    });

    it("question_queue_size_max should change limit of loaded FC", function(){
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*limit=2.*"))
                .respond(200, {data: generate_questions(2)});
        $practiceService.getQuestion();
        $httpBackend.flush();

        config.proso_models.practice.test.question_queue_size_max = 5;
        $practiceService.initSet("test");
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*limit=6.*"))
                .respond(200, {data: generate_questions(6)});
        $practiceService.getQuestion();
        $httpBackend.flush();

        config.proso_models.practice.test.set_length = config.proso_models.practice.test.question_queue_size_max = 10;
        $practiceService.initSet("test");
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*limit=10.*"))
                .respond(200, {data: generate_questions(10)});
        $practiceService.getQuestion();
        $httpBackend.flush();

        expect(true).toBe(true);
    });

    it("getting more questions", function(){
        var handler = jasmine.createSpy('success');
        config.proso_models.practice.test.question_queue_size_max = 4;
        config.proso_models.practice.test.set_length = 5;
        $practiceService.initSet("test");

        $practiceService.getQuestion().then(handler);
        $httpBackend.flush();
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(0);

        $practiceService.getQuestion().then(handler);
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(1);

        $practiceService.getQuestion().then(handler);
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(2);

        $practiceService.getQuestion().then(handler);
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(3);

        $practiceService.getQuestion().then(handler);
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(4);
    });

    it("getting more questions when not loaded yet", function(){
        var handler = jasmine.createSpy('success');
        var handler2 = jasmine.createSpy('error');
        $practiceService.question_queue_size_max = 0;

        $practiceService.getQuestion().then(handler);
        $practiceService.getQuestion().then(handler, handler2);
        $timeout.flush();
        $httpBackend.flush();
        expect(handler).toHaveBeenCalledWith(0);
        expect(handler2).toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalledWith(1);

    });

    it("reject get more FC than length", function(){
        var handler = jasmine.createSpy('success');
        var handler2 = jasmine.createSpy('error');
        config.proso_models.practice.test.question_queue_size_max = 10;
        config.proso_models.practice.test.set_length = 3;
        $practiceService.initSet("test");

        $practiceService.getQuestion().then(handler, handler2);
        $httpBackend.flush();
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(0);

        $practiceService.getQuestion().then(handler, handler2);
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(1);

        $practiceService.getQuestion().then(handler, handler2);
        $timeout.flush();
        expect(handler).toHaveBeenCalledWith(2);

        expect(handler2).not.toHaveBeenCalled();
        $practiceService.getQuestion().then(handler, handler2);
        $timeout.flush();
        expect(handler2).toHaveBeenCalled();

    });

    it("current counter", function(){
        config.proso_models.practice.test.set_length = 3;
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.question_queue_size_min = 1;
        $practiceService.initSet("test");
        expect($practiceService.getCurrent()).toBe(0);
        $practiceService.getQuestion();
        $httpBackend.flush();
        expect($practiceService.getCurrent()).toBe(1);
        $practiceService.getQuestion();
        $httpBackend.flush();
        expect($practiceService.getCurrent()).toBe(2);
        $practiceService.getQuestion();
        expect($practiceService.getCurrent()).toBe(3);
        $practiceService.getQuestion();
        expect($practiceService.getCurrent()).toBe(3);

    });

    it("should work with empty question list returned from server", function(){
        $httpBackend.expectGET(/\/models\/practice\/?.*/).respond(200, {data: []});
        $practiceService.getQuestion();
        $httpBackend.flush();
        expect($practiceService.getCurrent()).toBe(0);
    });

    it("queue length", function() {
        for (var size = 1; size <= 9; size++) {
            config.proso_models.practice.test.question_queue_size_max = size;
            $practiceService.initSet("test");
            $practiceService.preloadQuestions();
            $httpBackend.flush();
            expect($practiceService.getQuestionQueue().length).toBe(size);
        }

    });

    it("use of filter parameters", function(){
        var filter = {};
        filter.filter = [["type/cosi"], ["category/kdesi"]];
        filter.language= "xx";
        $practiceService.setFilter(filter);

        $httpBackend.expectGET(/\/models\/practice\/\?.*&filter=%5B%5B%22type%2Fcosi%22%5D,%5B%22category%2Fkdesi%22%5D%5D.*language=xx.*/).respond(200, {data: generate_questions(1)});
        $practiceService.preloadQuestions();
        $httpBackend.flush();

        expect($practiceService.getCurrent()).toBe(0);
    });

    it("avoid already loaded questions", function(){
        $httpBackend.expectGET(/\/models\/practice\/?.*/).respond(200, {data: [
          {payload: {item_id: 41}}, {payload: {item_id: 42}}, {payload: {item_id: 43}}
        ]});
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.question_queue_size_min = 3;
        $practiceService.initSet("test");
        $practiceService.preloadQuestions();
        $httpBackend.flush();

        $httpBackend.expectGET(/\/models\/practice\/?.*41,42,43.*/);
        $practiceService.getQuestion();
        $timeout.flush();
        $httpBackend.flush();

        expect($practiceService.getCurrent()).toBe(1);
    });

    it("should drop incoming FC after starting new set", function(){
        $practiceService.preloadQuestions();
        $practiceService.initSet("test");
        $httpBackend.flush();
        expect($practiceService.getQuestionQueue().length).toBe(0);
    });

    var generate_full_questions = function(limit, without_contexts, same_id){
        var questions = [];
        for (var i = 1; i <= limit; i++){
            var id = same_id ? 1 : i;
            var question = {
                "payload": {
                  "context_id": id
                }
            };
            if (!without_contexts) {
                question.payload.context = {id: id, content: 42};
            }
            questions.push(question);
        }
        return questions;
    };

    it("if cache context - still return question with context", function(){
        config.proso_models.practice.test.cache_context = true;
        $practiceService.initSet("test");
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*without_contexts.*"))
                .respond(200, {data: generate_full_questions(2, true, true)});
        $httpBackend.expectGET("/flashcards/context/1").respond({data: {id: 1, content: 42}});

        var question;
        $practiceService.getQuestion().then(function(d){question = d;});
        $httpBackend.flush();
        $timeout.flush();

        expect(question.payload.context).toBeDefined();
    });

    it("if cache context - context should have correct id", function(){
        config.proso_models.practice.test.cache_context = true;
        $practiceService.initSet("test");
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*without_contexts.*"))
            .respond(200, {data: generate_full_questions(2, true, true)});
        $httpBackend.expectGET("/flashcards/context/1").respond({data: {id: 1, content: 42}});

        var question;
        $practiceService.getQuestion().then(function(d){question = d;});
        $httpBackend.flush();
        $timeout.flush();

        expect(question.payload.context.id).toBe(question.payload.context_id);
    });

    it("if cache context - should load context separately", function(){
        config.proso_models.practice.test.cache_context = true;
        config.proso_models.practice.test.set_length = 2;
        $practiceService.initSet("test");
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*without_contexts.*"))
            .respond(200, {data: generate_full_questions(2, true)});
        $httpBackend.expectGET("/flashcards/context/1").respond({data: {id: 1, content: 42}});
        $httpBackend.expectGET("/flashcards/context/2").respond({data: {id: 2, content: 42}});

        var question;
        $practiceService.getQuestion().then(function(d){question = d;});
        $httpBackend.flush();
        $timeout.flush();
        expect(question.payload.context.id).toBe(question.payload.context_id);

        $practiceService.getQuestion().then(function(d){question = d;});
        $timeout.flush();
        expect(question.payload.context.id).toBe(question.payload.context_id);
    });

    it("if cache context - should load context only once", function(){
        config.proso_models.practice.test.cache_context = true;
        $practiceService.initSet("test");
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*without_contexts.*"))
            .respond(200, {data: generate_full_questions(10, true, true)});
        $httpBackend.expectGET("/flashcards/context/1").respond({data: {id: 1, content: 42}});

        var question, question2;
        $practiceService.getQuestion().then(function(d){question = d;});
        $httpBackend.flush();
        $timeout.flush();
        expect(question.payload.context.id).toBe(question.payload.context_id);

        $practiceService.getQuestion().then(function(d){question2 = d;});
        $timeout.flush();
        expect(question.payload.context.id).toBe(question.payload.context_id);

        expect(question).not.toBe(question2);
        expect(question.payload.context).toBe(question2.payload.context);
    });

    it("if not cache context - should not load context", function(){
        $practiceService.getQuestion();
        $httpBackend.flush();
        $timeout.flush();

        expect(true).toBe(true);
    });
});

describe("Practice Service - questions", function() {
    var $httpBackend, $practiceService, $timeout;

    var generate_questions = function(limit){
        var questions = [];
        for (var i = 0; i < limit; i++){
            questions.push(i);
        }
        return questions;
    };

    beforeEach(module('proso.apps.models-practice', "ngCookies"));

    beforeEach(module(function ($provide) { $provide.service("configService", configServiceMock); }));

    beforeEach(inject(function($injector) {

        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get("$timeout");
        $practiceService = $injector.get('practiceService');
    }));

    beforeEach(function(){
        $practiceService.initSet("test");
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it("only one request to practice resource", function(){
        $practiceService.preloadQuestions();
        $practiceService.preloadQuestions();
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*limit="+1+".*"))
            .respond(200, {data: generate_questions(1)});

        $httpBackend.flush();
    });

    it("check queue if request finished", function(){
        $practiceService.getQuestion();
        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*limit="+2+".*"))
            .respond(200, {data: generate_questions(1)});

        $httpBackend.expectGET(new RegExp("\/models\/practice\/?.*limit="+1+".*"))
            .respond(200, {data: generate_questions(1)});

        $httpBackend.flush();
    });
});

describe("Practice Service - answers", function() {
    var $httpBackend, $practiceService, $timeout;

    var generate_questions = function(limit){
        var questions = [];
        for (var i = 0; i < limit; i++){
            questions.push({
                "question_type": "xxxs",
                "answer_class": "flashcard_answer",
                "payload": {
                  "lang": "en",
                  "object_type": "fc_flashcard",
                  "item_id": 12,
                  "id": i,
                },
            });
        }
        return questions;
    };


    beforeEach(module('proso.apps.models-practice', "ngCookies"));
    beforeEach(module(function ($provide) { $provide.service("configService", configServiceMock); }));

    beforeEach(inject(function($injector) {

        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get("$timeout");
        $practiceService = $injector.get('practiceService');
    }));

    beforeEach(function(){
        for (var limit = 1; limit <=10; limit++){
            $httpBackend.whenGET(new RegExp("\/models\/practice\/?.*limit="+limit+".*"))
                .respond(200, {data: generate_questions(limit)});
        }
        $practiceService.initSet("test");
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


    it("flush answer queue", function() {
        expect($practiceService.getAnswerQueue()).toEqual([]);
        $practiceService.saveAnswer(1);
        $practiceService.saveAnswer(2);
        $practiceService.saveAnswer(3);
        expect($practiceService.getAnswerQueue()).toEqual([1,2,3]);

        $httpBackend.expectPOST("/models/answer/?filter=%5B%5D", {answers: [1,2,3]}).respond(200, "OK");
        $practiceService.flushAnswerQueue();
        $httpBackend.flush();
        expect($practiceService.getAnswerQueue()).toEqual([]);

        $httpBackend.expectPOST("/models/answer/?filter=%5B%5D", {answers: [1]}).respond(200, "OK");
        $practiceService.saveAnswer(1, true);
        $httpBackend.flush();
        expect($practiceService.getAnswerQueue()).toEqual([]);
    });


    it("save answer immediately", function() {
        config.proso_models.practice.test.save_answer_immediately = true;
        $practiceService.initSet("test");
        $httpBackend.expectPOST("/models/answer/?filter=%5B%5D", {answers: [1]}).respond(200, "OK");
        $practiceService.saveAnswer(1);
        $httpBackend.flush();
        expect($practiceService.getAnswerQueue()).toEqual([]);

        config.proso_models.practice.test.save_answer_immediately = false;
        $practiceService.initSet("test");
        $practiceService.saveAnswer(1);
        expect($practiceService.getAnswerQueue()).toEqual([1]);
    });

    it("save answer with getting FC", function() {
        $httpBackend.expectPOST(/\/models\/practice\/?.*/, {answers: [1, 2, 3]})
            .respond(200, {data: generate_questions(1)});
        $practiceService.saveAnswer(1);
        $practiceService.saveAnswer(2);
        $practiceService.saveAnswer(3);
        $practiceService.preloadQuestions();
        $httpBackend.flush();
        expect($practiceService.getAnswerQueue()).toEqual([]);
    });

    it("save answer at the end of set", function() {
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.set_length = 5;
        $practiceService.initSet("test");
        for (var i = 1; i < 5; i++){
            $practiceService.getQuestion();
            if (i === 1){
                $httpBackend.flush();
            }
            $timeout.flush();
            $practiceService.saveAnswer(i);
        }
        $httpBackend.expectPOST("/models/answer/?filter=%5B%5D", {answers: [1, 2, 3, 4, 5]}).respond(200, "OK");
        $practiceService.getQuestion();
        $practiceService.saveAnswer(i);
        $httpBackend.flush();

        expect($practiceService.getAnswerQueue()).toEqual([]);
    });

    it("save answer to current question", function() {
        config.proso_models.practice.test.save_answer_immediately = true;
        $practiceService.initSet("test");

        $practiceService.getQuestion();
        $httpBackend.flush();

        $httpBackend.expectPOST("/models/answer/?filter=%5B%5D", {"answers":[{"flashcard_id":0,"flashcard_answered_id":42,"response_time":42000,"question_type":"xxxs", answer_class:'flashcard_answer',"meta":{"client_meta":"moje meta"}, time_gap:0}]}).respond(200, "OK");
        $practiceService.saveAnswerToCurrentQuestion(42, 42000, "moje meta");
        $httpBackend.flush();

        $practiceService.getQuestion();
        $httpBackend.expectPOST("/models/answer/?filter=%5B%5D", {"answers":[{"flashcard_id":1,"flashcard_answered_id":null,"response_time":12,"question_type":"xxxs", answer_class:'flashcard_answer',"meta":{"client_meta":"moje meta"}, time_gap:0}]}).respond(200, "OK");
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");
        $httpBackend.flush();

        expect($practiceService.getAnswerQueue()).toEqual([]);
    });

    it("save answer to current question without question", function() {
        config.proso_models.practice.test.save_answer_immediately = true;
        $practiceService.initSet("test");
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");
        expect($practiceService.getAnswerQueue()).toEqual([]);
    });

    it("questions in summary", function() {
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.set_length = 5;
        $practiceService.initSet("test");
        $practiceService.getQuestion();
        $httpBackend.flush();
        $timeout.flush();
        $practiceService.getQuestion();
        $timeout.flush();
        $practiceService.getQuestion();
        $timeout.flush();

        expect($practiceService.getSummary().questions).toEqual(generate_questions(3));
     });

    it("answers in summary", function() {
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.set_length = 5;
        $practiceService.initSet("test");
        $practiceService.getQuestion();
        $httpBackend.flush();
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");

        $practiceService.getQuestion();
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(1, 32, "moje meta");

        $practiceService.getQuestion();
        $timeout.flush();
        $practiceService.saveAnswer(123);

        var answers = $practiceService.getSummary().answers;
        expect(answers[0].response_time).toBe(12);
        expect(answers[0].flashcard_answered_id).toBe(null);
        expect(answers[1].flashcard_answered_id).toBe(1);
        expect(answers[1].response_time).toBe(32);
        expect(answers[2]).toBe(123);
     });


    it("count in summary", function() {
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.set_length = 5;
        $practiceService.initSet("test");
        expect($practiceService.getSummary().count).toBe(0);
        $practiceService.getQuestion();
        $httpBackend.flush();
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");
        $practiceService.getQuestion();
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");
        expect($practiceService.getSummary().count).toBe(2);
        $practiceService.getQuestion();
        expect($practiceService.getSummary().count).toBe(2);
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");

        expect($practiceService.getSummary().count).toBe(3);
     });

    it("correct in summary", function() {
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.set_length = 5;
        $practiceService.initSet("test");
        expect($practiceService.getSummary().correct).toBe(0);
        $practiceService.getQuestion();
        $httpBackend.flush();
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");
        expect($practiceService.getSummary().correct).toBe(0);
        $practiceService.getQuestion();
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");
        expect($practiceService.getSummary().correct).toBe(0);
        $practiceService.getQuestion();
        $timeout.flush();
        $practiceService.saveAnswerToCurrentQuestion(2, 12, "moje meta");

        expect($practiceService.getSummary().correct).toBe(1);
     });

    it("create good time gaps", function() {
        config.proso_models.practice.test.question_queue_size_max = config.proso_models.practice.test.set_length = 2;
        $practiceService.initSet("test");

        $practiceService.getQuestion();
        $httpBackend.flush();

        $practiceService.saveAnswerToCurrentQuestion(42, 42000, "moje meta");

        $practiceService.getQuestion();
        var d = Date.now() + 3000;
        var x = spyOn(Date, 'now');
        x.and.callFake(function() { return d; });
        $practiceService.saveAnswerToCurrentQuestion(null, 12, "moje meta");

        $httpBackend.expectPOST("/models/answer/?filter=%5B%5D", {"answers":[
            {"flashcard_id":0,"flashcard_answered_id":42,"response_time":42000,"question_type":"xxxs",answer_class:'flashcard_answer',"meta":{"client_meta":"moje meta"}, time_gap:3},
            {"flashcard_id":1,"flashcard_answered_id":null,"response_time":12,"question_type":"xxxs",answer_class:'flashcard_answer',"meta":{"client_meta":"moje meta"}, time_gap:0}
        ]}).respond(200, "OK");
        $httpBackend.flush();

        expect($practiceService.getSummary().correct).toBe(0);

    });
});
