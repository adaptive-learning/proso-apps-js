var markdown = require('node-markdown').Markdown;

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        ngversion: '1.3.13',
        bsversion: '3.1.1',
        uibsversion: '0.13.0',
        modules: [],
        pkg: grunt.file.readJSON('package.json'),
        dist: 'dist',
        filename: 'proso-apps',
        meta: {
            modules: 'angular.module("proso.apps", [<%= srcModules %>]);',
            tplmodules: 'angular.module("proso.apps.tpls", [<%= tplModules %>]);',
            all: 'angular.module("proso.apps", ["proso.apps.tpls", <%= srcModules %>]);',
            banner: ['/*',
                     ' * <%= pkg.name %>',
                     ' * Version: <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
                     ' * License: <%= pkg.license %>',
                     ' */\n'].join('\n')
        },
        concat: {
            dist: {
                options: {
                    banner: '<%= meta.banner %><%= meta.modules %>\n',
                },
                src: [], //src filled in by build task
                dest: '<%= dist %>/<%= filename %>.js'
            },
            dist_tpls: {
                options: {
                    banner: '<%= meta.banner %><%= meta.all %>\n<%= meta.tplmodules %>\n',
                },
                src: [], //src filled in by build task
                dest: '<%= dist %>/<%= filename %>-tpls.js'
            }
        },
        jasmine : {
            src : 'src/*/*.js',
            options : {
                specs : 'src/*/specs/**/*.js',
                vendor : [
                    'node_modules/angular/angular.js',
                    'node_modules/angular-cookies/angular-cookies.js',
                    'node_modules/angular-mocks/angular-mocks.js',
                    'node_modules/jsTimezoneDetect/jstz.main.js',
                ],
                helpers : 'helpers/**/*.js',
            }
        },
        html2js: {
            dist: {
                options: {
                    module: null,
                    base: '.',
                },
                files: [{
                    expand: true,
                    src: ['templates/**/*.html'],
                    ext: '.html.js'
                }]
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                'src/**/*.js',
            ],
            options: {
                jshintrc: '.jshintrc'
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
                src: [
                    'src/**/*.js',
                    'templates/**/*.js',
                ],
                dest: 'dist/<%= pkg.name %>.min.js',
            }
        },
        copy: {
            demohtml: {
                options: {
                    //process html files with gruntfile config
                    processContent: grunt.template.process
                },
                files: [{
                    expand: true,
                    src: ['**/*.html'],
                    cwd: 'misc/demo/',
                    dest: 'dist/'
                }]
            },
            demoassets: {
                files: [{
                expand: true,
                //Don't re-copy html files, we process those
                src: ['**/**/*', '!**/*.html'],
                cwd: 'misc/demo',
                dest: 'dist/'
            }]
          }
        },
    });

    var foundModules = {};
    function findModule(name) {
        if (foundModules[name]) {
            return;
        }
        foundModules[name] = true;

        function breakup(text, separator) {
            return text.replace(/[A-Z]/g, function (match) {
                return separator + match;
            });
        }
        function ucwords(text) {
            return text.replace(/^([a-z])|\s+([a-z])/g, function ($1) {
                return $1.toUpperCase();
            });
        }
        function enquote(str) {
            return '"' + str + '"';
        }

        var module = {
            name: name,
            moduleName: enquote('proso.apps.' + name),
            displayName: ucwords(breakup(name, ' ')),
            srcFiles: grunt.file.expand('src/'+name+'/*.js'),
            tplFiles: grunt.file.expand('templates/'+name+'/*.html'),
            tpljsFiles: grunt.file.expand('templates/'+name+'/*.html.js'),
            tplModules: grunt.file.expand('templates/'+name+'/*.html').map(enquote),
            dependencies: dependenciesForModule(name),
            docs: {
                md: grunt.file.expand('src/'+name+'/docs/*.md')
                    .map(grunt.file.read).map(markdown).join('\n'),
                js: grunt.file.expand('src/'+name+'/docs/*.js')
                    .map(grunt.file.read).join('\n'),
                html: grunt.file.expand('src/'+name+'/docs/*.html')
                    .map(grunt.file.read).join('\n')
            }
        };

        module.dependencies.forEach(findModule);
        grunt.config('modules', grunt.config('modules').concat(module));
    }

    function dependenciesForModule(name) {
        var deps = [];
        grunt.file.expand('src/' + name + '/*.js').map(grunt.file.read).forEach(function(contents) {
            //Strategy: find where module is declared,
            //and from there get everything inside the [] and split them by comma
            var moduleDeclIndex = contents.indexOf('angular.module(');
            var depArrayStart = contents.indexOf('[', moduleDeclIndex);
            var depArrayEnd = contents.indexOf(']', depArrayStart);
            var dependencies = contents.substring(depArrayStart + 1, depArrayEnd);
            dependencies.split(',').forEach(function(dep) {
                if (dep.indexOf('proso.apps.') > -1) {
                    var depName = dep.trim().replace('proso.apps.','').replace(/['"]/g,'');
                    if (deps.indexOf(depName) < 0) {
                        deps.push(depName);
                        //Get dependencies for this new dependency
                        deps = deps.concat(dependenciesForModule(depName));
                    }
                }
            });
        });
        return deps;
    }

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-html2js');

    grunt.registerTask('test', ['jshint', 'jasmine']);
    grunt.registerTask('build', 'Build PROSO Apps -- javascript', function() {
        var _ = grunt.util._;

        grunt.file.expand({
            filter: 'isDirectory', cwd: '.'
        }, 'src/*').forEach(function(dir) {
            findModule(dir.split('/')[1]);
        });

        var modules = grunt.config('modules');
        grunt.config('srcModules', _.pluck(modules, 'moduleName'));
        grunt.config('tplModules', _.pluck(modules, 'tplModules').filter(function(tpls) { return tpls.length > 0;} ));
        grunt.config('demoModules', modules
            .filter(function(module) {
                return module.docs.md && module.docs.js && module.docs.html;
            })
            .sort(function(a, b) {
                if (a.name < b.name) { return -1; }
                if (a.name > b.name) { return 1; }
                return 0;
            })
        );

        var moduleFileMapping = _.clone(modules, true);
        moduleFileMapping.forEach(function (module) {
          delete module.docs;
        });

        grunt.config('moduleFileMapping', moduleFileMapping);

        var srcFiles = _.pluck(modules, 'srcFiles');
        var tpljsFiles = _.pluck(modules, 'tpljsFiles');
        //Set the concat task to concatenate the given src modules
        grunt.config('concat.dist.src', grunt.config('concat.dist.src')
                     .concat(srcFiles));
        //Set the concat-with-templates task to concat the given src & tpl modules
        grunt.config('concat.dist_tpls.src', grunt.config('concat.dist_tpls.src')
            .concat(srcFiles).concat(tpljsFiles));

        grunt.task.run(['html2js', 'uglify', 'concat', 'copy']);
    });
};
