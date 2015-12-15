(function () {

   var arrDependencies;

   arrDependencies = [
      'widgetCore',
      'ngAnimate'
   ];

   (function ( $app ) {
      'use strict';
      return $app;
   })(angular.module('livenowWidget', arrDependencies));
}).call(this);



(function () {

   'use strict';

   function appController( $scope, $widgetService, $apiService, $controller ) {

      // Extend the core controller that takes care of basic setup and common functions
      angular.extend(appController, $controller('widgetCoreController', {
         '$scope': $scope
      }));


      // Default arguments, these will be overridden by the arguments from the widget api
      $scope.defaultArgs = {
         listLimit: 0 // Set the list limit value to be used for pagination
      };

      // Set the initial list limit
      $scope.initialListLimit = $scope.defaultArgs.listLimit;

      // The live events grabbed from the api
      $scope.liveEvents = [];

      // An array of pages, used for pagination
      $scope.pages = [];

      // The index to start from
      $scope.startFrom = 0;

      // Default Widget height, used when resetting the list
      $scope.defaultHeight = 417;

      // The actual list of the widget
      $scope.currentHeight = 417;

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

         return $apiService.getLiveEvents(params).then(function ( response ) {
            $scope.liveEvents = response.data.liveEvents;

            // Check if the list limit is higher than the actual length of the list, set it to the actual length if so
            if ( $scope.initialListLimit > $scope.liveEvents.length ) {
               $scope.args.listLimit = $scope.liveEvents.length;
            }

            // Setup the pages
            $scope.setPages($scope.liveEvents, $scope.args.listLimit); // call the directive function here

            // If there are outcomes in the betslip we need update our event outcomes with this.
            // Request the betslip outcomes.
            $widgetService.requestBetslipOutcomes();
         }, function ( response ) {
            void 0;
            void 0;
         }).finally(function () {
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
         //outcome.selected = !outcome.selected;
      };

      /**
       * Iterate over the live events and update the offers with the data from the API
       * @param {Array} outcomes An array of outcomes that are in the betslip
       */
      $scope.updateOutcomes = function ( outcomes ) {
         var i = 0, eventLen = $scope.liveEvents.length;
         for ( ; i < eventLen; ++i ) {
            if ( $scope.liveEvents[i].mainBetOffer != null && $scope.liveEvents[i].mainBetOffer.outcomes != null ) {
               $scope.updateBetOfferOutcomes($scope.liveEvents[i].mainBetOffer, outcomes);
            }
         }
         $scope.$apply();
      };

      // Call the init method in the coreWidgetController so that we setup everything using our overridden values
      // The init-method returns a promise that resolves when all of the configurations are set, for instance the $scope.args variables
      // so we can call our methods that require parameters from the widget settings after the init method is called
      $scope.init().then(function(){
         // Fetch the live events
         $scope.getLiveEvents();
      });

      //----------------------------
      //------- Listeners ----------
      //----------------------------


      // Betslip outcomes listener
      $scope.$on('OUTCOMES:UPDATE', function ( event, data ) {
         $scope.updateOutcomes(data.outcomes);
      });

      // Odds format listener
      $scope.$on('ODDS:FORMAT', function ( event, data ) {
         $scope.setOddsFormat(data);
      });



   }

   (function ( $app ) {
      return $app.controller('appController', ['$scope', 'kambiWidgetService', 'kambiAPIService', '$controller', appController]);
   })(angular.module('livenowWidget'));

}).call(this);

/**
 * This controller takes care of the common widget implementations and should be extended by the widgets own controller(s)
 * @author Michael Blom <michael@globalmouth.com>
 */
(function () {

   'use strict';

   /**
    * @ngdoc controller
    * @name widgetCore.controller:widgetCoreController
    * @requires ng.$scope
    * @requires widgetCore.kambiWidgetService
    * @description
    * This controller takes care of the common widget implementations and should be extended by the widgets own controller(s)
    * @author <michael@globalmouth.com>
    */
   function widgetCoreController( $scope, $widgetService, $apiService, $q ) {

      /**
       * @ngdoc property
       * @name widgetCore.controller:apiConfigSet
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Flag to indicate that the config parameters are set for the json API service
       * @returns {Boolean} Default false
       * @type {Object}
       */
      $scope.apiConfigSet = false;

      /**
       * @ngdoc property
       * @name widgetCore.controller:appArgsSet
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Flag to indicate that the widget arguments have been received and set
       * @returns {Boolean} Default false
       */
      $scope.appArgsSet = false;

      /**
       * @ngdoc property
       * @name widgetCore.controller:oddsFormat
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description The odds format,
       * @returns {String} Default 'decimal'
       */
         //todo: Use the odds format setting
      $scope.oddsFormat = 'decimal';

      /**
       * @ngdoc property
       * @name widgetCore.controller:defaultHeight
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Default Widget height, used when resetting the list
       * @returns {Number} Default 350
       */
      $scope.defaultHeight = 350;

      /**
       * @ngdoc property
       * @name widgetCore.controller:currentHeight
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description The actual list of the widget
       * @returns {Number} Default 350
       */
      $scope.currentHeight = 350;

      /**
       * @ngdoc property
       * @name widgetCore.controller:apiVersion
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description What version of the JSON api to use
       * @returns {String} Default 'v2'
       */
      $scope.apiVersion = 'v2';

      /**
       * @ngdoc property
       * @name widgetCore.controller:streamingAllowedForPlayer
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Flag for allowing streaming
       * @returns {Boolean} Default false
       * @type {Object}
       */
      $scope.streamingAllowedForPlayer = false;

      /**
       * @ngdoc property
       * @name widgetCore.controller:defaultArgs
       * @propertyOf widgetCore.controller:widgetCoreController
       * @returns {Object} Object
       * @type {Object}
       */
      $scope.defaultArgs = {};

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#init
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Sets up the basic configurations and makes the initial requests to the widget API to setup the json and widget api
       * This should be called from the extending controller after the appropriate values are set so that we use those values
       *
       * @returns {Promise} A promise that resolve after the config and args have been set
       */
      $scope.init = function () {
         var initDeferred = $q.defer();

         // Setup a self-removing listener for the CLIENT:CONFIG event
         var clientConfigListener = $scope.$on('CLIENT:CONFIG', function ( event, data ) {
            if ( data.oddsFormat != null ) {
               $scope.setOddsFormat(data.oddsFormat);
            }
            data.version = $scope.apiVersion;

            // Set the configuration in the api Service and then set the flag to indicate that we have done so
            $apiService.setConfig(data);

            $scope.apiConfigSet = true;
            // Check if both page info and widget args have been received, if so resolve the init promise
            if ( $scope.apiConfigSet && $scope.appArgsSet ) {
               initDeferred.resolve();
            }
            // Remove this listener
            clientConfigListener();
         });

         // Self-removing listener for the WIDGET:ARGS event
         var removeWidgetArgsListener = $scope.$on('WIDGET:ARGS', function ( event, data ) {
            // Set the arguments for the app and then set the flag to indicate that this is done
            $scope.setArgs(data);
            // Set the offering in the API service
            if (data != null && data.hasOwnProperty('offering') ) {
               $apiService.setOffering(data.offering);
            } else {
               console.warn('No offering has been set, API requests will not work');
            }

            $scope.appArgsSet = true;
            // Check if both page info and widget args have been received, if so resolve the init promise
            if ( $scope.apiConfigSet && $scope.appArgsSet ) {
               initDeferred.resolve();
            }
            // Remove this listener
            removeWidgetArgsListener();
         });

         // Set the height of the widget and request the height so we can be sure that we have the correct value from the Sportsbook
         $widgetService.setWidgetHeight($scope.defaultHeight);
         $widgetService.requestWidgetHeight();
         // Enable transitions to make height changes purdy
         $widgetService.enableWidgetTransition(true);

         // Request the client configuration
         $widgetService.requestClientConfig();

         // Request the widget arguments
         $widgetService.requestWidgetArgs();

         // Request the outcomes from the betslip so we can update our widget, this will also sets up a subscription for future betslip updates
         $widgetService.requestBetslipOutcomes();
         // Request the odds format that is set in the sportsbook, this also sets up a subscription for future odds format changes
         $widgetService.requestOddsFormat();

         return initDeferred.promise;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#navigateToLiveEvent
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Navigate to a live event
       * @param {number} eventId Event id
       */
      $scope.navigateToLiveEvent = function ( eventId ) {
         $widgetService.navigateToLiveEvent(eventId);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#getWidgetHeight
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request widget height
       */
      $scope.getWidgetHeight = function () {
         $widgetService.requestWidgetHeight();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setWidgetHeight
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Set the height of the widget
       * @param {number} height Height in pixels
       */
      $scope.setWidgetHeight = function ( height ) {
         $scope.currentHeight = height;
         $widgetService.setWidgetHeight(height);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setWidgetEnableTransition
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Enable or disable CSS3 Transitions
       * @param {boolean} enable Enable transition
       */
      $scope.setWidgetEnableTransition = function ( enable ) {
         $widgetService.enableWidgetTransition(enable);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#removeWidget
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Remove the widget
       */
      $scope.removeWidget = function () {
         $widgetService.removeWidget();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#addOutcomeToBetslip
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Add an outcome to the betslip
       * @param {Object} outcome The outcome object
       */
      $scope.addOutcomeToBetslip = function ( outcome ) {
         $widgetService.addOutcomeToBetslip(outcome.id);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#removeOutcomeFromBetslip
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Remove an outcome from the betslip
       * @param {Object} outcome The outcome object
       */
      $scope.removeOutcomeFromBetslip = function ( outcome ) {
         $widgetService.removeOutcomeFromBetslip(outcome.id);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestBetslipOutcomes
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request the outcomes in the betslip
       */
      $scope.requestBetslipOutcomes = function () {
         $widgetService.requestBetslipOutcomes();
      };


      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestWidgetArgs
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request the widget arguments from the API
       */
      $scope.requestWidgetArgs = function () {
         $widgetService.requestWidgetArgs();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestPageInfo
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request page info from the API
       */
      $scope.requestPageInfo = function () {
         $widgetService.requestPageInfo();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestOddsFormat
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request the odds format set on the SportsBook
       */
      $scope.requestOddsFormat = function () {
         $widgetService.requestOddsFormat();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setOddsFormat
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Set the odds format of the widget
       * @param {String} oddsFormat - Odds format (decimal, american or fractional)
       */
      $scope.setOddsFormat = function ( oddsFormat ) {
         $scope.oddsFormat = oddsFormat;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#findEvent
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Iterates over the events and finds the one with the matching id
       * @param {Array.<Object>} events An array of events
       * @param {number} eventId the event id to search for
       * @returns {Object|null} Returns the event if found, otherwise null
       */
      $scope.findEvent = function ( events, eventId ) {
         var i = 0, len = events.length;
         for ( ; i < len; ++i ) {
            if ( events[i].id === eventId ) {
               return events[i];
            }
         }
         return null;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#getOutcomeLabel
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Parses the label based on it's type and the passed event
       * @param {Object} outcome Outcome object
       * @param {Object} event Event object
       */
      $scope.getOutcomeLabel = function ( outcome, event ) {
         return $apiService.getOutcomeLabel(outcome, event);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setArgs
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Sets the base configuration for the app based on what we get from the WIDGET:ARGS event
       * @param {Object} newArgs Arguments
       */
      $scope.setArgs = function ( newArgs ) {
         var args = $scope.defaultArgs;
         // Iterate over the default arguments, if the property exists in both the data and default arguments, set the value
         for ( var i in newArgs ) {
            if ( newArgs.hasOwnProperty(i) && args.hasOwnProperty(i) ) {
               args[i] = newArgs[i];
            }
         }
         $scope.args = args;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setPages
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Sets the pages based on the length of the provided list
       * @param {Array} list  An array of items that are to be paginated
       * @param {number} listLimit  How many items are shown in a page
       * @param {number} [listLength]  The total length of the list, if not passed list.length is used
       */
      $scope.setPages = function ( list, listLimit, listLength ) {
         var eventCount = listLength || list.length;
         var len = Math.ceil(eventCount / listLimit);
         var i = 0;
         $scope.pages = [];
         for ( ; i < len; ++i ) {
            // Set the page number and starting point for easier filtering in the view
            $scope.pages.push({
               startFrom: listLimit * i,
               page: i + 1
            });
         }
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#updateBetOfferOutcomes
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Updates the bet offer with new odds and flags the outcomes as selected if they are found
       * @param {Object} betOffer The betoffer to be updated
       * @param {Array.<Object>} outcomes The outcomes to update the bet offer data with
       */
      $scope.updateBetOfferOutcomes = function ( betOffer, outcomes ) {
         var i = 0, eventOutcomesLen = betOffer.outcomes.length, outcomesLen = outcomes.length;
         for ( ; i < eventOutcomesLen; ++i ) {
            var j = 0;
            var foundIndex = -1;
            betOffer.outcomes[i].selected = false;
            for ( ; j < outcomesLen; j++ ) {
               if ( betOffer.outcomes[i].id === outcomes[j].id ) {
                  betOffer.outcomes[i].odds = outcomes[j].odds;
                  foundIndex = i;
               }

               if ( foundIndex !== -1 ) {
                  betOffer.outcomes[foundIndex].selected = true;
               }
            }
         }
      };

      // Add a listener for the WIDGET:HEIGHT event and update the current height
      $scope.$on('WIDGET:HEIGHT', function ( event, height ) {
         $scope.currentHeight = height;
      });

   }

   (function ( $app ) {
      return $app.controller('widgetCoreController', ['$scope', 'kambiWidgetService', 'kambiAPIService', '$q', widgetCoreController]);
   })(angular.module('widgetCore', []));

})();

/**
 * A pagination directive used for client-side pagination
 */
(function () {

   'use strict';

   /**
    * @ngdoc directive
    * @name widgetCore.directive:kambiPaginationDirective
    * @description
    * A pagination directive used for client-side pagination
    * @restrict E
    * @scope    *
    * @author teo@globalmouth.com
    */
   (function ( $app ) {
      return $app.directive('kambiPaginationDirective', [function () {

         return {
            restrict: 'E',
            scope: {
               'list': '=list',
               'listLimit': '=',
               'pages': '=',
               'startFrom': '=',
               'activePage': '='
            },
            template: '<span ng-class="{disabled:activePage === 1}" ng-if="pages.length > 1" ng-click="pagePrev()" class="kw-page-link kw-pagination-arrow">' +
            '<i class="ion-ios-arrow-left"></i></span>' +
            '<span ng-if="pages.length > 1" ng-repeat="page in getPagination()" ng-click="setActivePage(page)" ng-class="{active:page === activePage}" ' +
            'class="kw-page-link l-pack-center l-align-center">{{page}}</span>' +
            '<span ng-class="{disabled:activePage === pages.length}" ng-if="pages.length > 1" ng-click="pageNext()" class="kw-page-link kw-pagination-arrow">' +
            '<i class="ion-ios-arrow-right"></i></span>',
            controller: ['$scope', function ( $scope ) {

               /**
                * @name widgetCore.directive:kambiPaginationDirective#activePage
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Default active page
                * @type {number} Default active page
                */
               $scope.activePage = 1;

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#setPage
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the page
                * @param {Object} page Page object
                * @param {Integer} page.startFrom Display page starting with this index
                * @param {Object} page.page Page object
                */
               $scope.setPage = function ( page ) {
                  $scope.startFrom = page.startFrom;
                  $scope.activePage = page.page;
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#setActivePage
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the current page. Takes in an integer, the index in array
                * @param {Integer} page Page index
                */
               $scope.setActivePage = function ( page ) {
                  $scope.setPage($scope.pages[page - 1]);
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#pagePrev
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the page to the previous one, if it's not already at the first page
                */
               $scope.pagePrev = function () {
                  if ( $scope.activePage > 1 ) {
                     $scope.setPage($scope.pages[$scope.activePage - 2]);
                  }
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#pageNext
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the page to the next one, if it's not already at the last page
                */
               $scope.pageNext = function () {
                  if ( $scope.activePage < $scope.pages.length ) {
                     $scope.setPage($scope.pages[$scope.activePage]);
                  }
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#pageCount
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Get the pagination amount of items based on liveevent and list limit
                * @returns {Number} Returns the page count
                */
               $scope.pageCount = function () {
                  return Math.ceil($scope.list.length / $scope.listLimit);
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#getPagination
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Get the pagination items.
                * @returns {Array} An array with the pagination items, used in ng-repeat
                */
               $scope.getPagination = function () {
                  var paginationItems = [],
                     paginationLimit = 5,
                     activePage = $scope.activePage,
                     pageCount = $scope.pageCount();

                  var startPage = 1, endPage = pageCount;

                  if ( paginationLimit < pageCount ) {
                     // Keep active page in middle by adjusting start and end
                     startPage = Math.max(activePage - Math.floor(paginationLimit / 2), 1);
                     endPage = startPage + paginationLimit - 1;

                     // Shift the list start and end
                     if ( endPage > pageCount ) {
                        endPage = pageCount;
                        startPage = endPage - paginationLimit + 1;
                     }
                  }

                  // Add page number links
                  for ( var i = startPage; i <= endPage; i++ ) {
                     paginationItems.push(i);
                  }

                  return paginationItems;
               };
            }]
         };
      }]);
   })(angular.module('widgetCore'));

})();

/**
 * A simple filter to start an ng-repeat at an offset
 */
(function () {
   (function ( $app ) {

      'use strict';

      /**
       * @ngdoc filter
       * @name widgetCore.filter:startFrom
       * @kind function
       * @description
       * A simple filter to start an ng-repeat at an offset
       * @author michael@globalmouth.com
       */
      $app.filter('startFrom', function () {
         return function ( input, start ) {
            if ( input ) {
               start = +start; //parse to int
               return input.slice(start);
            }
            return [];
         };
      });
   })(angular.module('widgetCore'));

})();


(function () {

   'use strict';

   (function ( $app ) {

      /**
       * @ngdoc service
       * @name widgetCore.kambiAPIService
       * @requires ng.$http
       * @requires ng.$q
       * @description
       * Service that integrates the Kambi Sportsbook JSON API
       */
      return $app.service('kambiAPIService', ['$http', '$q', function ( $http, $q ) {
         var kambiAPIService = {};

         /**
          * Specify what configuration properties will be available to set
          * @type {{apiBaseUrl: null, channelId: null, currency: null, locale: null, market: null, offering: null, clientId: null, version: string}}
          */
         kambiAPIService.configDefer = $q.defer();
         kambiAPIService.configSet = false;
         kambiAPIService.offeringSet = false;

         kambiAPIService.config = {
            apiBaseUrl: null,
            channelId: null,
            currency: null,
            locale: null,
            market: null,
            offering: null,
            clientId: null,
            version: 'v2'
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#setConfig
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Set the configuration of the API service, these settings are provided by the widget API
          * Only settings that correspond to the kambiAPIService.config properties will be set
          * @param {Object} config An object with configuration parameters
          */
         kambiAPIService.setConfig = function ( config ) {
            // Iterate over the passed object properties, if the exist in the predefined config object then we set them
            for ( var i in config ) {
               if ( config.hasOwnProperty(i) && kambiAPIService.config.hasOwnProperty(i) ) {
                  kambiAPIService.config[i] = config[i];
               }
            }
            // We need to replace the {apiVersion} part of the apiBaseUrl with the configured version
            kambiAPIService.config.apiBaseUrl = kambiAPIService.config.apiBaseUrl.replace(/\{apiVersion}/gi, kambiAPIService.config.version);
            kambiAPIService.configSet = true;
            if ( kambiAPIService.configSet && kambiAPIService.offeringSet ) {
               kambiAPIService.configDefer.resolve();
            }
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#setOffering
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Set the offering in the configuration
          * We will normally get this from the Widget Args and not the Client config, so it gets its own method
          * @param {String} offering Offering string
          *
          */
         kambiAPIService.setOffering = function ( offering ) {
            kambiAPIService.config.offering = offering;
            kambiAPIService.offeringSet = true;
            if ( kambiAPIService.configSet && kambiAPIService.offeringSet ) {
               kambiAPIService.configDefer.resolve();
            }
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getGroupEvents
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the events for a specific group
          * @param {number} groupId The group Id
          * @returns {Promise} Returns a promise
          */
         kambiAPIService.getGroupEvents = function ( groupId ) {
            var requesPath = '/event/group/' + groupId + '.json';
            return kambiAPIService.doRequest(requesPath);
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getLiveEvents
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the live events, returns a promise
          * @returns {Promise} Promise
          */
         kambiAPIService.getLiveEvents = function () {
            var requestPath = '/event/live/open.json';
            return kambiAPIService.doRequest(requestPath);
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getBetoffersByGroup
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the prematch bet offers for a specific group or list of groups
          * @param {number|Array.<number>} groupId The group id or list of group ids to get offers from
          * @param {number} [type] The bet offer type identifier
          * @param {String} [market] The geographical market
          * @param {String} [start] Starting date/time, restricts the result to events close to this date. ISO-8601
          * @param {number} [interval] The interval in minutes to include results, counting from start. Unlimited if not set
          * @returns {Promise} Promise
          */
         kambiAPIService.getBetoffersByGroup = function ( groupId, type, market, start, interval ) {
            var requestPath = '/betoffer/main/group/' + groupId + '.json';
            return kambiAPIService.doRequest(requestPath, {
               'include': 'participants'
            });
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getGroupById
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the specified group based on the id and it's contained groups, limited by depth
          * @param {number} groupId The id of the group to fetch
          * @param {number} depth The limiting depth of the contained groups
          * @returns {Promise} Promise
          */
         kambiAPIService.getGroupById = function(groupId, depth) {
            var requestPath = '/group/'+groupId + '.json';
            return kambiAPIService.doRequest(requestPath, {
               depth: depth
            });
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#doRequest
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Core method for calling the API, returns a promise
          * @param {string} requestPath The path to the request, following the offering id
          * @param {params} [params] parameters
          * @returns {Promise} Promise
          */
         kambiAPIService.doRequest = function ( requestPath, params ) {
            return kambiAPIService.configDefer.promise.then(function () {
               if ( kambiAPIService.config.offering == null ) {
                  return $q.reject('The offering has not been set, please provide it in the widget arguments');
               } else {
                  var requestUrl = kambiAPIService.config.apiBaseUrl + kambiAPIService.config.offering + requestPath;
                  var overrideParams = params || {};
                  var requestParams = {
                     lang: overrideParams.locale || kambiAPIService.config.locale,
                     market: overrideParams.market || kambiAPIService.config.market,
                     client_id: overrideParams.clientId || kambiAPIService.config.clientId,
                     include: overrideParams.include || null,
                     callback: 'JSON_CALLBACK'
                  };
                  return $http.jsonp(requestUrl, {
                     params: requestParams,
                     cache: false
                  });
               }
            });
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getOutcomeLabel
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Parses the label based on it's type and the passed event
          * @param {Object} outcome Outcome object
          * @param {Object} event Event object
          */
         kambiAPIService.getOutcomeLabel = function ( outcome, event ) {
            switch ( outcome.type ) {
               case 'OT_ONE': //Outcome has label 1. Applies to Threeway bet offers.
                  return event.homeName;
               case 'OT_CROSS': //Outcome has label X. Applies to Threeway bet offers.
                  // Todo: Translation
                  return 'Draw';
               case 'OT_TWO': //Outcome has label 2. Applies to Threeway bet offers.
                  return event.awayName;
               // Todo: Impelement these responses with translations

               //case 'OT_OVER': //The “Over” outcome in Over/Under bet offer.
               //break;
               //case 'OT_UNDER': //The “Under” outcome in Over/Under bet offer.
               //break;
               //case 'OT_ODD': //The “Odd” outcome in Odd/Even bet offer.
               //break;
               //case 'OT_EVEN': //The “Even” outcome in Odd/Even bet offer.
               //break;
               //case 'OT_ONE_ONE': //1-1 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_ONE_TWO': //1-2 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_ONE_CROSS': //1-X outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_TWO_ONE': //2-1 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_TWO_TWO': //2-2 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_TWO_CROSS': //2-X outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_CROSS_ONE': //X-1 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_CROSS_TWO': //X-2 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_CROSS_CROSS': //X-X outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_ONE_OR_TWO': //1 or 2 outcome in Double Chance bet offer.
               //break;
               //case 'OT_ONE_OR_CROSS': //1 or X outcome in Double Chance bet offer.
               //break;
               //case 'OT_CROSS_OR_TWO': //X or 2 outcome in Double Chance bet offer.
               //break;
               //case 'OT_YES': //“Yes” outcome in Head To Head and Yes/No bet offer.
               //break;
               //case 'OT_NO': //“No” outcome in Head To Head and Yes/No bet offer.
               //break;
               //case 'OT_OTHER': //“Other results” outcome in Result bet offer.
               //break;
               //case 'OT_UNTYPED': //Outcome does not have type.
               //break;
               //case 'OT_WC_HOME': //Outcome has label Home Win. Applies to WinCast bet offers.
               //break;
               //case 'OT_WC_DRAW': //Outcome has label Draw. Applies to WinCast bet offers.
               //break;
               //case 'OT_WC_AWAY': //Outcome has label Away Win. Applies to WinCast bet offers.
               //break;

               default:
                  console.warn('Unhandled outcome type: ' + outcome.type, outcome);
                  return outcome.label;
            }
         };

         return kambiAPIService;
      }]);
   })(angular.module('widgetCore'));
})();

/**
 * Service that implements the Kambi Widget API
 * Requests that call the widget API are all deferred so that the we ensure that the API is loaded when trying to call it
 * @author michael@globalmouth.com
 */
(function () {

   'use strict';

   (function ( $app ) {

      /**
       * @ngdoc service
       * @name widgetCore.kambiWidgetService
       * @requires ng.$rootScope
       * @requires ng.$window
       * @requires ng.$q
       * @description
       * Service that implements the Kambi Widget API
       * Requests that call the widget API are all deferred so that the we ensure that the API is loaded when trying to call it
       * @author michael@globalmouth.com
       */
      return $app.service('kambiWidgetService', ['$rootScope', '$window', '$q', function ( $rootScope, $window, $q ) {
         var kambiWidgetService = {}, KWpromise, KWdefer;


         //Setup the Kambi Widget API
         //To ensure that the API is loaded we set up a promise to resolve once the apiReady callback has fired

         if ( $window.KambiWidget ) {
            KWdefer = $q.defer();
            KWpromise = KWdefer.promise;

            $window.KambiWidget.apiReady = function ( api ) {
               kambiWidgetService.api = api;
               KWdefer.resolve(api);
            };
            $window.KambiWidget.receiveResponse = function ( dataObject ) {
               kambiWidgetService.handleResponse(dataObject);
            };
         } else {
            console.warn('Kambi widget api not loaded');
         }


         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#handleResponse
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Handle responses from the Kambi widget API
          * This should only be triggered from the Widget API, so there is nothing to return here
          * @param {Object} response the object has the parameters type and data
          * @param {String} response.type the type of the response
          * @param {*} response.data the response data
          */
         kambiWidgetService.handleResponse = function ( response ) {
            switch ( response.type ) {
               case  kambiWidgetService.api.WIDGET_HEIGHT:
                  // We've received a height response
                  $rootScope.$broadcast('WIDGET:HEIGHT', response.data);
                  break;
               case kambiWidgetService.api.BETSLIP_OUTCOMES:
                  // We've received a response with the outcomes currently in the betslip
                  $rootScope.$broadcast('OUTCOMES:UPDATE', response.data);
                  break;
               case kambiWidgetService.api.WIDGET_ARGS:
                  // We've received a response with the arguments set in the
                  $rootScope.$broadcast('WIDGET:ARGS', response.data);
                  break;
               case kambiWidgetService.api.PAGE_INFO:
                  // Received page info response
                  $rootScope.$broadcast('PAGE:INFO', response.data);
                  break;
               case kambiWidgetService.api.CLIENT_ODDS_FORMAT:
                  // Received odds format response
                  $rootScope.$broadcast('ODDS:FORMAT', response.data);
                  break;
               case kambiWidgetService.api.CLIENT_CONFIG:
                  $rootScope.$broadcast('CLIENT:CONFIG', response.data);
                  break;
               case kambiWidgetService.api.USER_LOGGED_IN:
                  console.debug('User logged in', response.data);
                  $rootScope.$broadcast('USER:LOGGED_IN', response.data);
                  break;
               default:
                  // Unahdled response
                  console.info('Unhandled response type: ' + response.type);
                  console.info(response);
                  break;
            }
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestWidgetHeight
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the height setting of the widget from the Sportsbook
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestWidgetHeight = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.WIDGET_HEIGHT);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#setWidgetHeight
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Uses the Kambi Widget API to set the height of the widgets iframe
          * @param {number} height the height to set the iframe to
          * @returns {Promise} Promise
          */
         kambiWidgetService.setWidgetHeight = function ( height ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.set(api.WIDGET_HEIGHT, height);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#enableWidgetTransition
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Uses the Kambi Widget API to enable or disable CSS3 Transitions, which will animate the widget iframe when it's resized or removed
          * @param   {boolean} enableTransition Set true to enable transition
          * @returns {Promise} Promise
          */
         kambiWidgetService.enableWidgetTransition = function ( enableTransition ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               if ( enableTransition ) {
                  api.set(api.WIDGET_ENABLE_TRANSITION);
               } else {
                  api.set(api.WIDGET_DISABLE_TRANSITION);
               }
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#removeWidget
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Removes the widgets iframe from the parent window
          * @returns {Promise} Promise
          */
         kambiWidgetService.removeWidget = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.remove();
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToLiveEvent
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates the Sportsbook to a live event
          * @param {number} eventId the id of the live event
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToLiveEvent = function ( eventId ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#event/live/' + eventId);
            });
            return deferred.promise;

         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToEvent
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates the Sportsbook to a pre-live event
          * @param {number} eventId the id of the pre-live event
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToEvent = function ( eventId ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#event/' + eventId);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToGroup
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates te Sportsbook to a specific group
          * @param {number} groupId the id of the group
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToGroup = function ( groupId ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#group/' + groupId);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToLiveEvents
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates the Sportsbook to a listing of all live events
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToLiveEvents = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#events/live');
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#addOutcomeToBetslip
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Adds one or more outcomes to the betslip
          * @param {number|Array} outcomes An id of an outcome, or an array of outcome ids
          * @param {number|Array} [stakes] A stake or an array of stakes corresponding to the outcomes
          * @param {String} [updateMode=replace] The update mode, 'append' or 'replace'
          * @param {String} [source] Optional campaign code
          * @returns {Promise} Promise
          */
         kambiWidgetService.addOutcomeToBetslip = function ( outcomes, stakes, updateMode, source ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               var arrOutcomes = [];
               // Check if the outcomes parameter is an array and add it, otherwise add the the single value as an array
               if ( angular.isArray(outcomes) ) {
                  arrOutcomes = outcomes;
               } else {
                  arrOutcomes.push(outcomes);
               }

               // Setup the data object to be sent to the widget API
               var data = {
                  outcomes: arrOutcomes
               };

               // Check if we got any stakes passed to use, add them to the data object if so
               if ( stakes != null ) {
                  if ( angular.isArray(stakes) ) {
                     data.stakes = stakes;
                  } else {
                     data.stakes = [stakes];
                  }
               }

               // Set the coupon type, defaults to TYPE_SINGLE
               data.couponType = arrOutcomes.length === 1 ? api.BETSLIP_OUTCOMES_ARGS.TYPE_SINGLE :
                  api.BETSLIP_OUTCOMES_ARGS.TYPE_COMBINATION;

               // Set the update mode, defaults to UPDATE_APPEND
               data.updateMode = updateMode !== 'replace' ? api.BETSLIP_OUTCOMES_ARGS.UPDATE_APPEND :
                  api.BETSLIP_OUTCOMES_ARGS.UPDATE_REPLACE;
               if ( source != null ) {
                  data.source = source;
               }

               // Send the data to the widget api
               api.set(api.BETSLIP_OUTCOMES, data);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#removeOutcomeFromBetslip
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Remove one or more outcomes from the betslip
          * @param {number|Array} outcomes An array of outcome ids or a single outcome id
          * @returns {Promise} Promise
          */
         kambiWidgetService.removeOutcomeFromBetslip = function ( outcomes ) {
            var deferred = $q.defer();

            KWpromise.then(function ( api ) {
               var arrOutcomes = [];
               if ( angular.isArray(outcomes) ) {
                  arrOutcomes = outcomes;
               } else {
                  arrOutcomes.push(outcomes);
               }
               api.set(api.BETSLIP_OUTCOMES_REMOVE, { outcomes: arrOutcomes });
            });

            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestBetslipOutcomes
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the outcomes that are in the betslip, also sets up a subscription for future updates
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestBetslipOutcomes = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.BETSLIP_OUTCOMES);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestPageInfo
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the page info
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestPageInfo = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.PAGE_INFO);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestWidgetArgs
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Requests the parameters sent to the widget from the Widget API
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestWidgetArgs = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.WIDGET_ARGS);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestClientConfig
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Requests the client configuration from the Widget API
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestClientConfig = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.CLIENT_CONFIG);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestOddsFormat
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the odds format from the widget api, also sets up a subscription for future updates
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestOddsFormat = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.CLIENT_ODDS_FORMAT);
            });
            return deferred.promise;
         };

         return kambiWidgetService;
      }]);
   })(angular.module('widgetCore'));
})();
