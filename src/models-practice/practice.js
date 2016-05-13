var m = angular.module('proso.apps.models-practice', ['ngCookies', 'proso.apps.common-config']);
m.service("practiceService", ["$http", "$q", "configService", "$cookies", function($http, $q, configService, $cookies){
    var self = this;

    var queue = [];
    var deferredQuestion = null;
    var promiseResolvedTmp = false;
    var currentQuestion = null;
    var answerQueue = [];

    var config = {};
    var current = 0;
    var setId = 0;
    var summary = {};

    var contexts = {};

    var loadingQuestions = false;

    // called on create and set reset
    self.initSet = function(configName){
        self.flushAnswerQueue();
        var key = "practice." + configName + ".";
        config.set_length = configService.getConfig("proso_models", key + "set_length", 10);
        config.question_queue_size_max = configService.getConfig("proso_models", key + "question_queue_size_max", 1);
        config.question_queue_size_min = configService.getConfig("proso_models", key + "question_queue_size_min", 1);
        config.save_answer_immediately = configService.getConfig("proso_models", key + "save_answer_immediately", false);
        config.cache_context = configService.getConfig("proso_models", key + "cache_context", false);

        self.setFilter({});
        current = 0;
        currentQuestion = null;
        self.clearQueue();
        deferredQuestion = null;
        setId++;
        summary = {
            questions: [],
            answers: [],
            correct: 0,
            count: 0
        };
    };

    self.setFilter = function(filter){
        config.filter = {
            filter: [],
        };
        angular.extend(config.filter, filter);
    };

    self.getCurrent = function(){
        return current;
    };

    self.getConfig = function(){
        return angular.copy(config);
    };

    // add answer to queue and upload queued answers if necessary
    self.saveAnswer = function(answer, forceSave){
        if (answer) {
            answer.time = Date.now();
            answerQueue.push(answer);
            summary.answers.push(answer);
            summary.count++;
            if (answer.flashcard_id === answer.flashcard_answered_id) {
                summary.correct++;
            }
        }

        if (config.save_answer_immediately || forceSave || current >= config.set_length) {
            if (answerQueue.length > 0) {
                answerQueue.forEach(function(answer){
                    answer.time_gap = Math.round((Date.now() - answer.time) / 1000);
                    delete answer.time;
                });
                $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
                $http.post("/models/answer/", {answers: answerQueue}, {params: _getFilter(['avoid', 'limit'])})
                    .error(function (response) {
                        console.error("Problem while uploading answer", response);
                    });
                answerQueue = [];
            }
        }
    };

    self.flushAnswerQueue = function(){
        self.saveAnswer(null, true);
    };

    // build answer from current question and save
    self.saveAnswerToCurrentQuestion = function(answeredId, responseTime, meta){
        if (!currentQuestion) {
            console.error("There is no current flashcard");
            return;
        }
        var answer = {
            flashcard_id: currentQuestion.payload.id,
            flashcard_answered_id: answeredId,
            response_time: responseTime,
            question_type: currentQuestion.question_type,
            answer_class: currentQuestion.answer_class,
        };
        if (meta) {
            answer.meta = {client_meta: meta};
        }
        if (currentQuestion.practice_meta) {
            if (answer.meta) {
                answer.meta = angular.extend(answer.meta, currentQuestion.practice_meta);
            } else {
                answer.meta = currentQuestion.practice_meta;
            }
        }
        if (currentQuestion.options){
            answer.option_ids = [];
            currentQuestion.options.forEach(function(o){
                if (o.id !== currentQuestion.id) {
                    answer.option_ids.push(o.id);
                }
            });
        }
        self.saveAnswer(answer);
    };

    // return promise of question
    self.getQuestion = function(){
        if(deferredQuestion){
            return $q(function(resolve, reject){
                reject("Already one question promised");
            });
        }
        deferredQuestion  = $q.defer();
        promiseResolvedTmp = false;
        _resolvePromise();
        deferredQuestion.promise.then(function(){ deferredQuestion = null;}, function(){ deferredQuestion = null;});
        return deferredQuestion.promise;
    };

    self.clearQueue = function(){
        queue = [];
    };

    // preload questions
    self.preloadQuestions = function(){
        _loadQuestions();
    };

    self.getQuestionQueue = function(){
        return queue;
    };

    self.getAnswerQueue = function(){
        return answerQueue;
    };

    self.getSummary = function(){
        var s = angular.copy(summary);
        for (var i = 0; i < Math.min(s.questions.length, s.answers.length); i++){
            var answer = s.answers[i];
            var question = s.questions[i];
            if (question.id === answer.flashcard_id){
                question.answer = answer;
            }
            answer.correct = answer.flashcard_id === answer.flashcard_answered_id;
        }
        return s;
    };


    var _loadQuestions = function(){
        if (loadingQuestions){
            return;                             // loading request is already running
        }

        if (queue.length >= config.question_queue_size_min) { return; }                                       // if there are some questions queued
            config.filter.limit  = config.question_queue_size_max - queue.length;
        if (deferredQuestion && !promiseResolvedTmp) { config.filter.limit ++; }                  // if we promised one question
        config.filter.limit = Math.min(config.filter.limit, config.set_length - current - queue.length);  // check size of set
        if (config.filter.limit === 0) {return;}                         // nothing to do
        config.filter.avoid = currentQuestion && currentQuestion.payload ? [currentQuestion.payload.id] : [];      // avoid current question
        queue.forEach(function(question){
            config.filter.avoid.push(question.payload.id);
        });

        var filter = _getFilter();
        var request;
        if (answerQueue.length === 0) {
            request = $http.get("/models/practice/", {params: filter});
        }else{
            $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
            request = $http.post("/models/practice/", {answers: answerQueue}, {params: filter});
            answerQueue = [];
        }
        var request_in_set = setId;
        loadingQuestions = true;
        request
            .success(function(response){
                loadingQuestions = false;
                if (request_in_set !== setId) {
                    return;
                }
                queue = queue.concat(response.data);
                _loadContexts();
                if (queue.length > 0) {
                    _resolvePromise();
                }
                else{
                    console.error("No Questions to practice");
                }
            })
            .error(function (response) {
                loadingQuestions = false;
                if (deferredQuestion !== null){
                    deferredQuestion.reject("Something went wrong while loading questions from backend.");
                }
                console.error("Something went wrong while loading questions from backend.");
            });
    };

    var _loadContexts = function(){
        if (config.cache_context){
            queue.forEach(function(question){
                if (question.context_id in contexts){
                    if (contexts[question.context_id] !== "loading"){
                        question.context = contexts[question.context_id];
                    }
                }else{
                    contexts[question.context_id] = "loading";
                    $http.get("/flashcards/context/" + question.context_id, {cache: true})
                        .success(function(response){
                            contexts[question.context_id] = response.data;
                            _resolvePromise();
                        }).error(function(){
                            delete contexts[question.context_id];
                            console.error("Error while loading context from backend");
                        });
                }
            });
        }
    };

    var _resolvePromise = function(){
        if (deferredQuestion === null){
            return;
        }
        if (config.set_length === current){
            deferredQuestion.reject("Set was completed");
            return;
        }
        if (queue.length > 0) {
            if (config.cache_context){
                if (typeof contexts[queue[0].context_id]  === 'object'){
                    queue[0].context = contexts[queue[0].context_id];
                }else{
                    return;
                }
            }
            currentQuestion = queue.shift();
            current++;
            promiseResolvedTmp = true;
            summary.questions.push(currentQuestion);
            deferredQuestion.resolve(currentQuestion);
        }
        _loadQuestions();
    };

    var _getFilter = function(ignore) {
        if (!ignore) {
            ignore = [];
        }
        var filter = {};
        for (var key in config.filter){
            if (ignore.indexOf(key) !== -1) {
                continue;
            }
            if (config.filter[key] instanceof Array) {
                filter[key] = JSON.stringify(config.filter[key]);
            }else{
                filter[key] = config.filter[key];
            }
        }
        if (config.cache_context){
            filter.without_contexts = 1;
        }
        return filter;
    };
}]);
