(function () {

   var arrDependencies;

   arrDependencies = [
      'widgetCore',
      'widgetCore.translate',
      'ngAnimate'
   ];

   (function ($app) {
      'use strict';
      return $app;
   })(angular.module('livenowWidget', arrDependencies));
}).call(this);

(function () {

   'use strict';

   function appController ( $scope, $widgetService, $apiService, $controller, timerService, $timeout ) {

      // Extend the core controller that takes care of basic setup and common functions
      angular.extend(appController, $controller('widgetCoreController', {
         '$scope': $scope
      }));

      // Default arguments, these will be overridden by the arguments from the widget api
      $scope.defaultArgs = {
         listLimit: 1, // Set the list limit value to be used for pagination
         useFilter: false, // Get the live events from filtering
         fallBackFilter: 'all/all/all/' // Set a fallback filter if we cant get the filter from the url
      };

      // Set the initial list limit
      $scope.initialListLimit = $scope.defaultArgs.listLimit;

      // The live events grabbed from the api
      $scope.events = [];

      // An array of pages, used for pagination
      $scope.pages = [];

      // The index to start from
      $scope.startFrom = 0;

      // Default Widget height, used when resetting the list
      $scope.defaultHeight = 515;

      // The actual list of the widget
      // $scope.currentHeight = 515;

      // By default enable animation
      $scope.enableAnimation = true;

      // Check that the list limit is not set to 0
      if ( $scope.initialListLimit === 0 ) {
         $scope.initialListLimit = 3;
      }

      /**
       * Fetches the data from the API and sets up pages
       */
      $scope.getLiveEvents = function ( params ) {
         // In case we want to indicate that we are loading data, set the loading flag
         $scope.loading = true;

         // Use filter to get events or get all live events.
         // TODO: Remove this implementation once live events can be filtered
         if ( $scope.args.useFilter ) {
            $scope.apiService = $apiService.getLiveEventsByFilter;
         } else {
            $scope.apiService = $apiService.getLiveEvents;
         }

         return $scope.apiService(params).then(function ( response ) {
            if ( response.data.events != null ) {
               $scope.events = response.data.events;
            } else {
               $scope.events = [];
            }

            // Setup the pages
            $scope.setPages($scope.events, $scope.args.listLimit); // Call the directive function here

            // If there are outcomes in the betslip we need update our event outcomes with this.
            // Request the betslip outcomes.
            $widgetService.requestBetslipOutcomes();

            // Start the global timer
            timerService.stop();
            timerService.start();

            // Enable back the animation after 300ms delay
            $timeout(function () {
               $scope.enableAnimation = true;
            }, 300);

         }, function ( response ) {
            void 0;
            void 0;
         }).finally(function () {

            // Check if the list limit is higher than the actual length of the list, set it to the actual length if so
            if ( $scope.initialListLimit > $scope.events.length ) {
               $scope.args.listLimit = $scope.events.length;
            }

            // Hide the widget if there are no live events to show
            if ( $scope.events && $scope.events.length > 0 ) {
               $widgetService.setWidgetHeight($scope.args.listLimit * 145 + 37 * 2);
            } else {
               $widgetService.setWidgetHeight(0);
            }

            // Finally we unset the loading flag
            $scope.loading = false;
         });
      };

      $scope.toggleOutcome = function ( outcome ) {
         if ( outcome.selected !== true ) {
            $scope.addOutcomeToBetslip(outcome);
         } else {
            $scope.removeOutcomeFromBetslip(outcome);
         }
         // Outcome.selected = !outcome.selected;
      };

      /**
       * Iterate over the live events and update the offers with the data from the API
       * @param {Array} outcomes An array of outcomes that are in the betslip
       */
      $scope.updateOutcomes = function ( outcomes ) {
         var i = 0, eventLen = $scope.events.length;
         for ( ; i < eventLen; ++i ) {
            if ( $scope.events[i].betOffers[0] != null && $scope.events[i].betOffers[0].outcomes != null ) {
               $scope.updateBetOfferOutcomes($scope.events[i].betOffers[0], outcomes);
            }
         }
         $scope.$apply();
      };

      // Call the init method in the coreWidgetController so that we setup everything using our overridden values
      // The init-method returns a promise that resolves when all of the configurations are set, for instance the $scope.args variables
      // so we can call our methods that require parameters from the widget settings after the init method is called
      $scope.init().then(function () {
         // Set filter parameters
         if ( $scope.pageInfo.pageType === 'filter' ) {
            $scope.params = $scope.pageInfo.pageParam;
         } else {
            $scope.params = $scope.args.fallBackFilter;
         }
         // Fetch the live events
         $scope.getLiveEvents($scope.params);
      });

      // ------- Listeners ----------

      // Betslip outcomes listener
      $scope.$on('OUTCOMES:UPDATE', function ( event, data ) {
         $scope.updateOutcomes(data.outcomes);
      });

      // Odds format listener
      $scope.$on('ODDS:FORMAT', function ( event, data ) {
         $scope.setOddsFormat(data);
      });

      // Listen to timer and refresh events every 30 sec
      // We disable the animation until after the events are loaded
      $scope.$on('TIMER:UPDATE', function ( e, count ) {
         if ( count % 30 === 0 ) {
            $scope.enableAnimation = false;
            $scope.getLiveEvents($scope.params);
         }
      });

   }

   (function ( $app ) {
      return $app.controller('appController', ['$scope', 'kambiWidgetService', 'kambiAPIService', '$controller', 'timerService', '$timeout', appController]);
   })(angular.module('livenowWidget'));

}).call(this);

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
            controller: ['$scope', '$rootScope', 'timerService', function ( $scope, $rootScope, timerService ) {

               /**
                * Prepends a zero for numbers below 10
                * @param time
                * @returns {*}
                */
               var readableTime = function ( time ) {
                  if ( time < 0 ) {
                     time = 0;
                  }

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
                * Get the current event minute and second based on event data and internal timer
                * @param count
                */
               var getRealTime = function ( count ) {
                  if ( $scope.timer && $scope.timer.running ) {
                     var eventSeconds = $scope.timer.minute * 60 + $scope.timer.second + count;
                     $scope.second = parseSeconds(eventSeconds).seconds;
                     $scope.minute = parseSeconds(eventSeconds).minutes;
                  }
               };

               /**
                * Sets the default value for minute and second based on api data
                */
               if ( $scope.timer ) {
                  if ( $scope.timer.running === false ) {
                     $scope.minute = readableTime($scope.timer.minute);
                     $scope.second = readableTime($scope.timer.second);
                  } else {
                     getRealTime(timerService.seconds);
                  }
               }

               /**
                * Listener for timer update event, which sets the scope minute and second
                */
               $rootScope.$on('TIMER:UPDATE', function ( e, count ) {
                  getRealTime(count);
               });
            }]
         };
      }]);
   })(angular.module('livenowWidget'));

})();
