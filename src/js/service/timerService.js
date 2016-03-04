(function () {

   'use strict';

   (function ($app) {

      /**
       * TimerService
       */
      return $app.service('timerService', ['$rootScope', '$interval', function ($rootScope, $interval) {

         var timerService = {};

         timerService.seconds = 0;

         /**
          * Start timer and broadcast an event
          */
         timerService.start = function () {
            timerService.interval = $interval(function () {
               timerService.seconds++;
               $rootScope.$broadcast('TIMER:UPDATE', timerService.seconds);
            }, 1000);
         };

         /**
          * Stops the timer
          */
         timerService.stop = function () {
            timerService.seconds = 0;
            $interval.cancel(timerService.interval);
         };

         return timerService;
      }]);
   })(angular.module('livenowWidget'));
})();
