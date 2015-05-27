var m = angular.module('proso.apps.flashcards-userStats', ['ngCookies']);
m.service("userStatsService", ["$http", "$cookies", function($http, $cookies){
    var self = this;

    var filters = {};

    self.addGroup = function (id, data) {
        if (!data.language){
            delete data.language;
        }
        filters[id] = data;
    };

    self.addGroupParams = function (id, categories, contexts, types, language) {
        filters[id] = {
            categories: categories,
            contexts: types,
            types: types
        };
        if (typeof language !== "undefined"){
            filters[id].language = language;
        }
    };

    self.getStats = function(mastered){
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        var params = {filters: JSON.stringify(filters)};
        if (mastered){
            params.mastered = true;
        }
        return $http.get("/flashcards/user_stats/", {params: params});
    };

    self.getStatsPost = function(mastered){
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        var params  = mastered ? "?mastered=true" : "";
        return $http.post("/flashcards/user_stats/" + params, filters);
    };

    self.clean = function(){
        filters = {};
    };

    self.getGroups = function (){
        return angular.copy(filters);
    };

}]);
