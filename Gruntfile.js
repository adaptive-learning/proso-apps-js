module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jasmine : {
            src : 'src/**/*.js',
            options : {
                specs : 'specs/**/*.js',
                vendor : [
                    'node_modules/angular/angular.js',
                    'node_modules/angular-cookies/angular-cookies.js',
                    'node_modules/angular-mocks/angular-mocks.js',
                    'node_modules/jsTimezoneDetect/jstz.main.js',
                ],
                helpers : 'helpers/**/*.js',
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                'src/**/*.js',
                'test/**/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        concat: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n',
            },
            dist: {
                src: 'src/**/*.js',
                dest: '<%= pkg.name %>.js',
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                sourceMapIncludeSources: true,
                sourceMapName: '<%= pkg.name %>.min.js.map',
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n',
            },
            dist: {
                src: 'src/**/*.js',
                dest: '<%= pkg.name %>.min.js',
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('test', ['jshint', 'jasmine']);
    grunt.registerTask('build', ['uglify', 'concat']);
};
