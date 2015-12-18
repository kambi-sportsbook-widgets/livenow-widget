/**
 * Timer directive
 * @author teo@globalmouth.com
 */
(function () {

   'use strict';

   /**
    * @ngdoc directive
    * @name livenowWidget.directive:timerDirective
    * @description
    * Timer directive displays the event matchClock and calculates the current game time
    * @restrict E
    * @scope    *
    * @author teo@globalmouth.com
    */
   (function ( $app ) {
      return $app.directive('timerDirective', [function () {

         return {
            restrict: 'E',
            scope: {
               'index': '=',
               'timer': '='
            },
            template: '<span ng-if="minute || second" ng-cloak>{{minute}} : {{second}}</span>',
            controller: ['$scope', '$rootScope', function ( $scope, $rootScope ) {

               /**
                * Prepends a zero for numbers below 10
                * @param time
                * @returns {*}
                */
               var readableTime = function( time ) {
                  if ( time < 10 ) {
                     time = '0' + time;
                  }
                  return time;
               };

               /**
                * Transform seconds into minutes and seconds
                * @param count
                * @returns {{minutes, seconds}}
                */
               var parseSeconds = function ( count ) {
                  var input_count = parseInt(count, 10);
                  var minutes = Math.floor(input_count / 60);
                  var seconds = input_count - (minutes * 60);
                  return {
                     minutes: readableTime(minutes),
                     seconds: readableTime(seconds)
                  };
               };

               /**
                * Sets the default value for minute and second based on api data
                */
               if ( $scope.timer.running === false ) {
                  $scope.minute = readableTime($scope.timer.minute);
                  $scope.second = readableTime($scope.timer.second);
               }

               /**
                * Listener for timer update event, which sets the scope minute and second
                */
               $rootScope.$on('TIMER:UPDATE', function ( e, count ) {

                  var eventSeconds = $scope.timer.minute * 60 + $scope.timer.second + count;

                  if ( $scope.timer.running ) {
                     $scope.second = parseSeconds(eventSeconds).seconds;
                     $scope.minute = parseSeconds(eventSeconds).minutes;
                  }
               });
            }]
         };
      }]);
   })(angular.module('livenowWidget'));

})();
